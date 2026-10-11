import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

// Resolve both real tooling consumers, so every transitive path must be patched.
const rootRequire = createRequire(new URL("../package.json", import.meta.url));
function consumerRequire(chain) {
  return chain.reduce(
    (require, name) => createRequire(require.resolve(`${name}/package.json`)),
    rootRequire
  );
}
const consumers = [
  [
    "API Extractor",
    ["@microsoft/api-extractor", "@rushstack/ts-command-line", "argparse"],
  ],
  [
    "coverage tooling",
    [
      "babel-plugin-istanbul",
      "@istanbuljs/load-nyc-config",
      "js-yaml",
      "argparse",
    ],
  ],
];
for (const [name, chain] of consumers) {
  const { sprintf, vsprintf } = consumerRequire(chain)("sprintf-js");
  describe(`${name}: installed sprintf-js patch`, () => {
    it("keeps ordinary precision", () => {
      assert.equal(sprintf("%.2f", 1.2), "1.20");
      assert.equal(sprintf("%.2e", 1), "1.00e+0");
      assert.equal(sprintf("%.2g", 1.23), "1.2");
      assert.equal(vsprintf("%s: %d", ["tool", 42]), "tool: 42");
    });

    it("clamps precision above the ECMAScript limit of 100", () => {
      assert.equal(sprintf("%.10000f", 1), `1.${"0".repeat(100)}`);
      assert.equal(sprintf("%.10000e", 1).startsWith("1."), true);
      assert.ok(sprintf("%.10000g", 1).length < 120);
    });
  });
}
