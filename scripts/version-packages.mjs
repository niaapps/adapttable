#!/usr/bin/env node
/** Changesets changes package metadata; pnpm validates the preserved graph. */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { versionLockfile } from "./version-lockfile.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const run = (args) => execFileSync(pnpm, args, { cwd: root, stdio: "inherit" });
const lockPath = join(root, "pnpm-lock.yaml");
const lockedGraph = readFileSync(lockPath, "utf8");
run(["exec", "changeset", "version"]);
writeFileSync(
  lockPath,
  versionLockfile(lockedGraph, (path) =>
    JSON.parse(readFileSync(join(root, path), "utf8"))
  )
);
// Validate all manifests against the lock without selecting different versions.
run(["install", "--lockfile-only", "--frozen-lockfile", "--ignore-scripts"]);
run([
  "exec",
  "prettier",
  "--write",
  ".changeset/*.json",
  "packages/*/*/CHANGELOG.md",
  "packages/*/*/package.json",
  "starters/*/package.json",
]);
