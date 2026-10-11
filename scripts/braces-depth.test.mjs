import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

// Explicit dev fixtures keep the patch contract independent of ESLint's dependencies.
const require = createRequire(new URL("../package.json", import.meta.url));
const braces = require("braces");

describe("the installed braces patch", () => {
  it("expands an ordinary pattern", () => {
    assert.deepEqual(braces("a/{b,c}/d", { expand: true }), ["a/b/d", "a/c/d"]);
    assert.equal(braces.compile("a/{b,c}/d"), "a/(b|c)/d");
  });

  it("rejects nesting past the depth guard before the call stack overflows", () => {
    const pattern = `${"{".repeat(101)}a${"}".repeat(101)}`;
    assert.throws(
      () => braces(pattern),
      /brace depth \(101\) exceeds max depth \(100\)/
    );
    assert.throws(
      () => braces(pattern, { expand: true }),
      /brace depth \(101\) exceeds max depth \(100\)/
    );
    assert.throws(
      () => braces(pattern, { maxDepth: 1000 }),
      /brace depth \(101\) exceeds max depth \(100\)/
    );
  });
});
