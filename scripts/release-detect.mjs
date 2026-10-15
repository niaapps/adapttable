/**
 * Decide whether a main-push Release job should version, publish, or skip.
 * Pending changesets open a Version PR. Unpublished package versions run
 * build → publint → changeset publish. A completed release of this commit
 * skips registry detection; uncertain registry responses stop the run.
 */

/**
 * @typedef {{ name: string, version: string }} Publishable
 * @typedef {{
 *   needVersion: boolean,
 *   needPublish: boolean,
 *   reason: string,
 * }} ReleasePlan
 */

/**
 * Changeset notes are `*.md` files in `.changeset/`. The folder README is not
 * a pending release.
 *
 * @param {string[]} files
 * @returns {string[]}
 */
export function pendingChangesets(files) {
  return files.filter((f) => f.endsWith(".md") && f !== "README.md");
}

/**
 * @param {{
 *   changesetFiles: string[],
 *   packages: Publishable[],
 *   published: Record<string, string | null | undefined>,
 * }} input `published[name]` is the exact version found in the registry,
 *   `null` if that version is absent, `undefined` if the lookup failed.
 * @returns {ReleasePlan}
 */
export function classifyRelease({ changesetFiles, packages, published }) {
  if (pendingChangesets(changesetFiles).length > 0) {
    return {
      needVersion: true,
      needPublish: false,
      reason: "pending changesets",
    };
  }

  const unpublished = packages.filter((p) => published[p.name] !== p.version);
  if (unpublished.length === 0) {
    return {
      needVersion: false,
      needPublish: false,
      reason: "nothing to version or publish",
    };
  }

  const lookupFailed = unpublished.filter(
    (p) => published[p.name] === undefined
  );
  if (lookupFailed.length > 0) {
    throw new Error(
      `Cannot determine published versions for ${lookupFailed.map((p) => p.name).join(", ")}; retry release detection before publishing`
    );
  }
  return {
    needVersion: false,
    needPublish: true,
    reason: "unpublished versions",
  };
}

async function runPublished(get, api, runId) {
  for (let page = 1; ; page++) {
    const { jobs } = await get(
      `${api}/runs/${runId}/jobs?per_page=100&page=${page}`
    );
    if (
      jobs.some((job) => job.name === "Publish" && job.conclusion === "success")
    ) {
      return true;
    }
    if (jobs.length < 100) return false;
  }
}

/**
 * Only a successful Release workflow with a successful Publish job proves
 * this commit finished releasing. Version-only and failed runs permit recovery.
 * Workflow concurrency must serialize this check with the preceding release.
 *
 * @param {{ repository: string, sha: string, token: string, fetchImpl?: typeof fetch }} input
 * @returns {Promise<number | null>}
 */
export async function completedReleaseRun({
  repository,
  sha,
  token,
  fetchImpl = fetch,
}) {
  const api = `https://api.github.com/repos/${repository}/actions`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const get = async (url) => {
    const res = await fetchImpl(url, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`Release history lookup failed (HTTP ${res.status})`);
    }
    return res.json();
  };
  for (let page = 1; ; page++) {
    const runs = await get(
      `${api}/workflows/release.yml/runs?head_sha=${encodeURIComponent(sha)}&status=success&per_page=100&page=${page}`
    );
    for (const run of runs.workflow_runs) {
      if (run.head_sha !== sha || run.conclusion !== "success") continue;
      if (await runPublished(get, api, run.id)) return run.id;
    }
    if (runs.workflow_runs.length < 100) return null;
  }
}

/**
 * Query the immutable version endpoint instead of a possibly stale latest tag.
 * Retry transient failures; an unknown result must never authorize publishing.
 *
 * @param {Publishable} pkg
 * @param {{ fetchImpl?: typeof fetch }} options
 * @returns {Promise<string | null | undefined>}
 */
export async function publishedVersion(pkg, { fetchImpl = fetch } = {}) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(pkg.name)}/${encodeURIComponent(pkg.version)}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetchImpl(url, {
        headers: { "Cache-Control": "no-cache" },
        signal: AbortSignal.timeout(15_000),
      });
      if (res.status === 404) return null;
      if (res.ok) {
        const body = await res.json();
        if (body.version === pkg.version) return body.version;
      }
    } catch {
      // Retry network failures before reporting an unknown registry state.
    }
  }
  return undefined;
}

function printPlan(plan) {
  process.stdout.write(
    `needVersion=${plan.needVersion}\nneedPublish=${plan.needPublish}\n`
  );
  process.stderr.write(`release-detect: ${plan.reason}\n`);
}

const invokedDirectly = process.argv[1]?.endsWith("release-detect.mjs");
if (invokedDirectly) {
  const { readdir, readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const { listPackages, REPO_ROOT: root } = await import("./packages.mjs");

  const changesetDir = join(root, ".changeset");
  const config = JSON.parse(
    await readFile(join(changesetDir, "config.json"), "utf8")
  );
  const ignored = new Set(config.ignore ?? []);
  const changesetFiles = await readdir(changesetDir);
  if (
    pendingChangesets(changesetFiles).length === 0 &&
    process.env.GITHUB_ACTIONS === "true"
  ) {
    const { GITHUB_REPOSITORY, GITHUB_SHA, GH_TOKEN } = process.env;
    if (!GITHUB_REPOSITORY || !GITHUB_SHA || !GH_TOKEN) {
      throw new Error("Release history requires repository, commit and token");
    }
    const released = await completedReleaseRun({
      repository: GITHUB_REPOSITORY,
      sha: GITHUB_SHA,
      token: GH_TOKEN,
    });
    if (released !== null) {
      printPlan({
        needVersion: false,
        needPublish: false,
        reason: `commit already released by successful run ${released}`,
      });
      process.exit(0);
    }
  }
  /** @type {Publishable[]} */
  const packages = [];
  for (const { dir } of listPackages(root)) {
    const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
    if (pkg.private || ignored.has(pkg.name) || !pkg.name || !pkg.version) {
      continue;
    }
    packages.push({ name: pkg.name, version: pkg.version });
  }

  /** @type {Record<string, string | null | undefined>} */
  const published = {};
  await Promise.all(
    packages.map(async (p) => {
      published[p.name] = await publishedVersion(p);
    })
  );

  printPlan(classifyRelease({ changesetFiles, packages, published }));
}
