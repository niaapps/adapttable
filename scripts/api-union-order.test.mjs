import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { canonicalLiteralUnions } from "./api-union-order.mjs";

const report = (source) =>
  `## API Report\r\n\r\n\`\`\`ts\r\n${source}\r\n\`\`\`\r\n`;

test("equivalent string unions compare identically without losing members", () => {
  assert.equal(
    canonicalLiteralUnions(
      report('export type Props = ("labels" | "classNames" | "dir")[];')
    ),
    canonicalLiteralUnions(
      report('export type Props = ("labels" | "dir" | "classNames")[];')
    )
  );
  assert.notEqual(
    canonicalLiteralUnions(report('export type Props = "labels" | "dir";')),
    canonicalLiteralUnions(
      report('export type Props = "labels" | "dir" | "container";')
    )
  );
  assert.match(
    canonicalLiteralUnions(report('type Duplicate = "b" | "a" | "a";')),
    /"a" \| "a" \| "b"/
  );
});
test("tuple, overload, object, intersection and documentation order stays exact", () => {
  for (const source of [
    'export type Tuple = ["b", "a"];',
    "export type Union = { b: string } | { a: number };",
    "export type Intersection = B & A;",
    'export function call(x: "b"): void;\nexport function call(x: "a"): void;',
    'export type Comment = "b" | /* first */ "a";',
  ])
    assert.equal(canonicalLiteralUnions(report(source)), report(source));
});
test("nested literal unions sort while surrounding signatures remain exact", () => {
  const value = canonicalLiteralUnions(
    report('export type Nested = { first: "b" | "a"; second: ("d" | "c")[]; };')
  );
  assert.match(value, /first: "a" \| "b"; second: \("c" \| "d"\)\[\]/);
  assert.ok(value.endsWith("\r\n```\r\n"));
});
test("malformed reports and plain text stay unchanged", () => {
  for (const value of [
    'text "b" | "a"',
    "```ts\ntype Incomplete =",
    report("type Incomplete = ;"),
  ]) {
    assert.equal(canonicalLiteralUnions(value), value);
  }
});
test("the committed shadcn props compare identically when their literal union is reordered", () => {
  const committed = readFileSync(
    new URL("../etc/adapter-shadcn-vue-column-menu.api.md", import.meta.url),
    "utf8"
  );
  const reordered = committed.replace(/"[\w-]+"(?: \| "[\w-]+")+/, (members) =>
    members.split(" | ").reverse().join(" | ")
  );
  assert.notEqual(committed, reordered);
  assert.equal(
    canonicalLiteralUnions(committed),
    canonicalLiteralUnions(reordered)
  );
});
