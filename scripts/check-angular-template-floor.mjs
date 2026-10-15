/** Parse shipped Angular templates with the binding's minimum compiler. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import ts from "typescript";

import { REPO_ROOT } from "./packages.mjs";

function filesIn(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? filesIn(join(dir, entry.name))
      : [join(dir, entry.name)]
  );
}

function templatesIn(file) {
  const source = readFileSync(file, "utf8");
  if (file.endsWith(".html")) return [source];
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const templates = [];
  const visit = (node) => {
    if (
      ts.isPropertyAssignment(node) &&
      node.name.getText(ast) === "template" &&
      (ts.isNoSubstitutionTemplateLiteral(node.initializer) ||
        ts.isStringLiteral(node.initializer))
    ) {
      templates.push(node.initializer.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return templates;
}

const binding = join(REPO_ROOT, "packages/angular/angular/package.json");
const range = JSON.parse(readFileSync(binding, "utf8")).peerDependencies[
  "@angular/core"
];
const floor = /^\^(\d+\.\d+\.\d+)/.exec(range)?.[1];
assert.ok(floor, `Cannot determine Angular floor from ${range}`);
const scratch = mkdtempSync(
  join(tmpdir(), "adapttable-angular-template-floor-")
);
try {
  writeFileSync(
    join(scratch, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: { "@angular/compiler": floor },
    })
  );
  const npm = join(
    dirname(process.execPath),
    process.platform === "win32" ? "npm.cmd" : "npm"
  );
  execFileSync(npm, ["install", "--no-audit", "--no-fund"], {
    cwd: scratch,
    stdio: "pipe",
  });
  const fromFloor = createRequire(join(scratch, "package.json"));
  const installed = JSON.parse(
    readFileSync(fromFloor.resolve("@angular/compiler/package.json"), "utf8")
  ).version;
  assert.equal(installed, floor);
  const { parseTemplate } = await import(
    pathToFileURL(fromFloor.resolve("@angular/compiler")).href
  );
  const packages = ["angular", "adapter-angular-unstyled", "ai-angular"];
  let count = 0;
  const errors = [];
  for (const folder of packages) {
    const files = filesIn(join(REPO_ROOT, "packages/angular", folder, "src"));
    for (const file of files.filter(
      (path) => /\.(ts|html)$/.test(path) && !path.endsWith(".test.ts")
    )) {
      for (const template of templatesIn(file)) {
        count++;
        const parsed = parseTemplate(template, file);
        errors.push(...(parsed.errors ?? []).map(String));
      }
    }
  }
  assert.ok(count > 0, "No Angular templates were checked");
  assert.deepEqual(errors, [], errors.join("\n"));
  console.log(
    `Angular ${floor}: ${count} production templates parsed successfully`
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
