/** Keep release metadata synchronized without resolving a new dependency graph. */
import assert from "node:assert/strict";
import { posix } from "node:path";

import { parse, parseDocument } from "yaml";

export const VERSION_METADATA =
  /^(?:packages\/[^/]+\/[^/]+\/(?:package\.json|CHANGELOG\.md)|starters\/[^/]+\/package\.json|\.changeset\/[^/]+\.md|pnpm-lock\.yaml)$/;
const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
];

/** Update only local package specifiers; every resolved version stays untouched. */
export function versionLockfile(source, readManifest) {
  const document = parseDocument(source);
  if (document.errors.length) throw document.errors[0];
  const lock = document.toJS();
  for (const [directory, importer] of Object.entries(lock.importers)) {
    const manifest = readManifest(posix.normalize(`${directory}/package.json`));
    for (const section of dependencySections) {
      for (const [name, entry] of Object.entries(importer[section] ?? {})) {
        updateWorkspaceSpecifier({
          document,
          lock,
          directory,
          manifest,
          section,
          name,
          entry,
          readManifest,
        });
      }
    }
  }
  return document.toString({ lineWidth: 0 });
}

function updateWorkspaceSpecifier({
  document,
  lock,
  directory,
  manifest,
  section,
  name,
  entry,
  readManifest,
}) {
  if (!name.startsWith("@adapttable/")) return;
  const specifier = lock.overrides?.[name] ?? manifest[section]?.[name];
  if (typeof specifier !== "string" || !entry.version.startsWith("link:")) {
    throw new Error(
      `Expected a linked workspace dependency: ${directory} ${name}`
    );
  }
  const targetPath = posix.normalize(
    `${directory}/${entry.version.slice("link:".length)}/package.json`
  );
  const target = readManifest(targetPath);
  assert.equal(
    target.name,
    name,
    `Workspace link points to another package: ${name}`
  );
  if (!specifier.startsWith("workspace:")) {
    assert.equal(
      specifier,
      target.version,
      `Expected exact workspace version: ${name}`
    );
  }
  if (entry.specifier !== specifier) {
    document.setIn(
      ["importers", directory, section, name, "specifier"],
      specifier
    );
  }
}

function releaseVersions(manifests, readBase, readHead) {
  const versions = new Map();
  for (const file of manifests) {
    const before = JSON.parse(readBase(file));
    const after = JSON.parse(readHead(file));
    assert.equal(before.name, after.name);
    assert.match(
      after.version ?? before.version,
      /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/
    );
    versions.set(after.name, { before: before.version, after: after.version });
  }
  return versions;
}

function updateManifestVersionReferences(manifest, versions) {
  for (const section of [...dependencySections, "peerDependencies"]) {
    for (const [name, value] of Object.entries(manifest[section] ?? {})) {
      const version = versions.get(name);
      if (
        !name.startsWith("@adapttable/") ||
        !version?.before ||
        !version.after
      )
        continue;
      if (
        [version.before, `^${version.before}`, `~${version.before}`].includes(
          value
        )
      ) {
        manifest[section][name] = value.replace(version.before, version.after);
      }
    }
  }
}

/** Reject dependency, script, export, peer or resolved-graph changes in release diffs. */
export function isVersionMetadata(files, readBase, readHead) {
  if (!files.length || !files.every((file) => VERSION_METADATA.test(file)))
    return false;
  try {
    const manifests = files.filter((file) => file.endsWith("/package.json"));
    const versions = releaseVersions(manifests, readBase, readHead);
    for (const file of manifests) {
      const before = JSON.parse(readBase(file));
      const after = JSON.parse(readHead(file));
      before.version = after.version;
      updateManifestVersionReferences(before, versions);
      assert.deepEqual(before, after);
    }
    const expected = versionLockfile(readBase("pnpm-lock.yaml"), (file) =>
      JSON.parse(readHead(posix.normalize(file)))
    );
    assert.deepEqual(parse(expected), parse(readHead("pnpm-lock.yaml")));
    return true;
  } catch {
    // Missing files, malformed metadata or any graph drift require the full gate.
    return false;
  }
}
