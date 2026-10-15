import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { parse } from "yaml";

import {
  classifyRelease,
  completedReleaseRun,
  pendingChangesets,
  publishedVersion,
} from "./release-detect.mjs";

describe("pendingChangesets", () => {
  it("ignores the folder README and non-markdown files", () => {
    assert.deepEqual(
      pendingChangesets(["README.md", "config.json", "cool-fish.md"]),
      ["cool-fish.md"]
    );
  });
});

describe("classifyRelease", () => {
  const core = { name: "@adapttable/core", version: "2.6.0" };

  it("opens a Version PR when a changeset is pending, even if npm matches", () => {
    const plan = classifyRelease({
      changesetFiles: ["README.md", "neat-fox.md"],
      packages: [core],
      published: { "@adapttable/core": "2.6.0" },
    });
    assert.equal(plan.needVersion, true);
    assert.equal(plan.needPublish, false);
  });

  it("skips when nothing is pending and every version is on npm", () => {
    const plan = classifyRelease({
      changesetFiles: ["README.md"],
      packages: [core],
      published: { "@adapttable/core": "2.6.0" },
    });
    assert.equal(plan.needVersion, false);
    assert.equal(plan.needPublish, false);
    assert.equal(plan.reason, "nothing to version or publish");
  });

  it("publishes when the target version is not in the registry", () => {
    const plan = classifyRelease({
      changesetFiles: ["README.md"],
      packages: [core],
      published: { "@adapttable/core": "2.5.0" },
    });
    assert.equal(plan.needVersion, false);
    assert.equal(plan.needPublish, true);
    assert.equal(plan.reason, "unpublished versions");
  });

  it("publishes a never-published package", () => {
    const plan = classifyRelease({
      changesetFiles: [],
      packages: [core],
      published: { "@adapttable/core": null },
    });
    assert.equal(plan.needPublish, true);
  });

  it("stops publishing when a registry lookup failed", () => {
    assert.throws(
      () =>
        classifyRelease({
          changesetFiles: ["README.md"],
          packages: [core],
          published: { "@adapttable/core": undefined },
        }),
      /Cannot determine published versions.*@adapttable\/core/
    );
  });
});

describe("completedReleaseRun", () => {
  const input = {
    repository: "owner/repo",
    sha: "released-commit",
    token: "test-token",
  };
  const run = (id, conclusion = "success", sha = input.sha) => ({
    id,
    head_sha: sha,
    conclusion,
  });

  it("finds the first successful publisher before a queued duplicate runs", async () => {
    const requests = [];
    const released = await completedReleaseRun({
      ...input,
      fetchImpl: async (url, options) => {
        requests.push(String(url));
        assert.equal(options.headers.Authorization, "Bearer test-token");
        return Response.json(
          String(url).includes("/jobs?")
            ? { jobs: [{ name: "Publish", conclusion: "success" }] }
            : { workflow_runs: [run(38778408144)] }
        );
      },
    });
    assert.equal(released, 38778408144);
    assert.match(requests[0], /release\.yml\/runs\?head_sha=released-commit/);
    assert.match(requests[0], /status=success/);
    assert.match(requests[1], /runs\/38778408144\/jobs/);
  });

  it("allows recovery after failed releases and ignores other commits", async () => {
    let calls = 0;
    assert.equal(
      await completedReleaseRun({
        ...input,
        fetchImpl: async () => {
          calls++;
          return Response.json({
            workflow_runs: [run(1, "failure"), run(2, "success", "other")],
          });
        },
      }),
      null
    );
    assert.equal(calls, 1);
  });

  it("does not treat version-only or skipped Publish jobs as releases", async () => {
    assert.equal(
      await completedReleaseRun({
        ...input,
        fetchImpl: async (url) =>
          Response.json(
            String(url).includes("/jobs?")
              ? {
                  jobs: [
                    { name: "Version Packages PR", conclusion: "success" },
                    { name: "Publish", conclusion: "skipped" },
                  ],
                }
              : { workflow_runs: [run(1)] }
          ),
      }),
      null
    );
  });

  it("checks subsequent pages of runs and jobs", async () => {
    const requests = [];
    assert.equal(
      await completedReleaseRun({
        ...input,
        fetchImpl: async (url) => {
          const path = String(url);
          requests.push(path);
          const secondPage = path.endsWith("page=2");
          return Response.json(
            path.includes("/jobs?")
              ? {
                  jobs: secondPage
                    ? [{ name: "Publish", conclusion: "success" }]
                    : Array.from({ length: 100 }, () => ({
                        name: "Detect",
                        conclusion: "success",
                      })),
                }
              : {
                  workflow_runs: secondPage
                    ? [run(101)]
                    : Array.from({ length: 100 }, (_, n) =>
                        run(n, "success", "other")
                      ),
                }
          );
        },
      }),
      101
    );
    assert.equal(requests.length, 4);
  });

  it("stops when release history cannot be checked", async () => {
    await assert.rejects(
      completedReleaseRun({
        ...input,
        fetchImpl: async () => new Response(null, { status: 403 }),
      }),
      /Release history lookup failed \(HTTP 403\)/
    );
  });
});

describe("publishedVersion", () => {
  const pkg = { name: "@adapttable/core", version: "3.11.0" };

  it("looks up the exact version independently of the latest tag", async () => {
    assert.equal(
      await publishedVersion(pkg, {
        fetchImpl: async (url, options) => {
          assert.equal(
            url,
            "https://registry.npmjs.org/%40adapttable%2Fcore/3.11.0"
          );
          assert.equal(options.headers["Cache-Control"], "no-cache");
          return Response.json({
            version: "3.11.0",
            "dist-tags": { latest: "3.10.0" },
          });
        },
      }),
      "3.11.0"
    );
  });

  it("recognizes a missing version", async () => {
    assert.equal(
      await publishedVersion(pkg, {
        fetchImpl: async () => new Response(null, { status: 404 }),
      }),
      null
    );
  });

  it("retries temporary registry errors", async () => {
    let attempts = 0;
    assert.equal(
      await publishedVersion(pkg, {
        fetchImpl: async () => {
          attempts++;
          if (attempts === 1) throw new Error("connection reset");
          if (attempts === 2) return new Response(null, { status: 503 });
          return Response.json({ version: pkg.version });
        },
      }),
      pkg.version
    );
    assert.equal(attempts, 3);
  });

  it("returns unknown after repeated invalid registry responses", async () => {
    let attempts = 0;
    assert.equal(
      await publishedVersion(pkg, {
        fetchImpl: async () => {
          attempts++;
          return Response.json({});
        },
      }),
      undefined
    );
    assert.equal(attempts, 3);
  });
});

it("serializes releases and supplies read-only history access to detection", () => {
  const workflow = parse(
    readFileSync(
      new URL("../.github/workflows/release.yml", import.meta.url),
      "utf8"
    )
  );
  assert.equal(workflow.concurrency.group, "release-${{ github.ref }}");
  assert.equal(workflow.concurrency["cancel-in-progress"], false);
  assert.equal(workflow.jobs.detect.permissions.actions, "read");
  const flags = workflow.jobs.detect.steps.find((step) => step.id === "flags");
  assert.equal(flags.env.GH_TOKEN, "${{ github.token }}");
});
