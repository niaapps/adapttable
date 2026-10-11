import assert from "node:assert/strict";
import { test } from "node:test";

import { parse, stringify } from "yaml";

import { classify } from "./ci-detect.mjs";
import { isVersionMetadata, versionLockfile } from "./version-lockfile.mjs";

function fixture() {
  const base = {
    "package.json": { name: "root", private: true },
    "packages/vue/vue/package.json": {
      name: "@adapttable/vue",
      version: "0.1.0",
      exports: { ".": "./dist/index.js" },
    },
    "packages/vue/adapter/package.json": {
      name: "@adapttable/kit",
      version: "0.1.0",
      dependencies: { "@adapttable/vue": "0.1.0" },
    },
    "starters/kit/package.json": {
      name: "starter",
      version: "0.0.0",
      dependencies: { "@adapttable/kit": "^0.1.0", vite: "^8.3.0" },
    },
  };
  const lock = {
    lockfileVersion: "9.0",
    settings: { autoInstallPeers: true },
    overrides: { "@adapttable/kit": "workspace:*" },
    importers: {
      ".": {},
      "packages/vue/vue": {},
      "packages/vue/adapter": {
        dependencies: {
          "@adapttable/vue": { specifier: "0.1.0", version: "link:../vue" },
        },
      },
      "starters/kit": {
        dependencies: {
          "@adapttable/kit": {
            specifier: "workspace:*",
            version: "link:../../packages/vue/adapter",
          },
          vite: { specifier: "^8.3.0", version: "8.3.0(peer@1.0.0)" },
        },
      },
    },
    packages: {
      "vite@8.3.0": { resolution: { integrity: "verified-integrity" } },
    },
    snapshots: {
      "vite@8.3.0(peer@1.0.0)": { dependencies: { peer: "1.0.0" } },
    },
    patchedDependencies: {
      "dependency@1.0.0": {
        hash: "verified-patch",
        path: "patches/dependency.patch",
      },
    },
  };
  const head = structuredClone(base);
  head["packages/vue/vue/package.json"].version = "0.1.1";
  head["packages/vue/adapter/package.json"].version = "0.1.1";
  head["packages/vue/adapter/package.json"].dependencies["@adapttable/vue"] =
    "0.1.1";
  head["starters/kit/package.json"].dependencies["@adapttable/kit"] = "^0.1.1";
  const locked = stringify(lock);
  const updated = versionLockfile(locked, (file) => head[file]);
  const read = (manifests, source) => (file) =>
    file === "pnpm-lock.yaml" ? source : JSON.stringify(manifests[file]);
  const files = [
    "packages/vue/vue/package.json",
    "packages/vue/adapter/package.json",
    "starters/kit/package.json",
    "pnpm-lock.yaml",
    ".changeset/bump.md",
    "packages/vue/vue/CHANGELOG.md",
  ];
  return { base, head, lock, locked, updated, files, read };
}

test("versioning preserves resolutions, peer snapshots, security patches and starter overrides", () => {
  const { lock, updated, locked, head, read, base, files } = fixture();
  const next = parse(updated);
  assert.deepEqual(next.packages, lock.packages);
  assert.deepEqual(next.snapshots, lock.snapshots);
  assert.deepEqual(next.patchedDependencies, lock.patchedDependencies);
  assert.equal(
    next.importers["packages/vue/adapter"].dependencies["@adapttable/vue"]
      .specifier,
    "0.1.1"
  );
  assert.deepEqual(
    next.importers["starters/kit"],
    lock.importers["starters/kit"]
  );
  assert.equal(
    isVersionMetadata(files, read(base, locked), read(head, updated)),
    true
  );
  const flags = classify(files, { verifiedVersionOnly: true });
  assert.equal(flags.runPublint, true);
  assert.equal(flags.needBuild, true);
  assert.equal(flags.runUnit, false);
  assert.equal(flags.runPlaywright, false);
});

for (const [name, mutate] of [
  [
    "new dependency",
    (head) => {
      head["packages/vue/adapter/package.json"].dependencies.other = "1.0.0";
    },
  ],
  [
    "script change",
    (head) => {
      head["packages/vue/vue/package.json"].scripts = { build: "different" };
    },
  ],
  [
    "export change",
    (head) => {
      head["packages/vue/vue/package.json"].exports["."] = "./other.js";
    },
  ],
  [
    "starter tooling change",
    (head) => {
      head["starters/kit/package.json"].dependencies.vite = "^8.4.0";
    },
  ],
  [
    "unrelated internal range",
    (head) => {
      head["starters/kit/package.json"].dependencies["@adapttable/kit"] =
        "~0.1.1";
    },
  ],
]) {
  test(`release classification rejects ${name}`, () => {
    const { base, head, locked, updated, files, read } = fixture();
    mutate(head);
    assert.equal(
      isVersionMetadata(files, read(base, locked), read(head, updated)),
      false
    );
  });
}
for (const section of [
  "packages",
  "snapshots",
  "settings",
  "overrides",
  "patchedDependencies",
]) {
  test(`release classification rejects drift in ${section}`, () => {
    const { base, head, locked, updated, files, read } = fixture();
    const drift = parse(updated);
    drift[section].unexpected = "changed";
    assert.equal(
      isVersionMetadata(
        files,
        read(base, locked),
        read(head, stringify(drift))
      ),
      false
    );
    const flags = classify(files, { verifiedVersionOnly: false });
    assert.equal(flags.runUnit, true);
    assert.equal(flags.runPlaywright, true);
  });
}
test("source changes, invalid YAML and missing files cannot become release-only", () => {
  const { base, head, locked, updated, files, read } = fixture();
  assert.equal(
    isVersionMetadata(
      [...files, "packages/vue/vue/src/index.ts"],
      read(base, locked),
      read(head, updated)
    ),
    false
  );
  assert.equal(
    isVersionMetadata(files, read(base, locked), () => {
      throw new Error("missing");
    }),
    false
  );
  assert.throws(() => versionLockfile("[broken", () => head));
});
test("the version writer rejects wrong workspace links and non-exact package pins", () => {
  const { head, lock } = fixture();
  head["packages/vue/vue/package.json"].name = "@adapttable/other";
  assert.throws(
    () => versionLockfile(stringify(lock), (file) => head[file]),
    /another package/
  );
  head["packages/vue/vue/package.json"].name = "@adapttable/vue";
  head["packages/vue/adapter/package.json"].dependencies["@adapttable/vue"] =
    "^0.1.1";
  assert.throws(
    () => versionLockfile(stringify(lock), (file) => head[file]),
    /exact workspace version/
  );
});

test("release metadata paths must match the complete filename", () => {
  const { base, head, locked, updated, files, read } = fixture();
  for (const path of [
    "packages/vue/vue/package.json.bak",
    ".changeset/config.json",
    ".changeset/changelog.js",
    "starters/kit/package.json.ts",
  ]) {
    assert.equal(
      isVersionMetadata(
        [...files, path],
        read(base, locked),
        read(head, updated)
      ),
      false
    );
  }
});
