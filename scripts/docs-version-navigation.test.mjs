import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { docsVersionTarget } from "./docs-version-navigation.mjs";

describe("documentation version navigation", () => {
  const routes = new Set([
    "/react/getting-started/",
    "/angular/getting-started/",
    "/react/row-spanning/",
    "/react/filtering/",
    "/v1/react/getting-started/",
    "/v1/react/filtering/",
    "/v2/react/getting-started/",
    "/v2/react/row-spanning/",
  ]);

  it("preserves a page that exists in the selected snapshot", () => {
    assert.deepEqual(docsVersionTarget("/react/filtering/", "v1", routes), {
      href: "/v1/react/filtering/",
      samePage: true,
    });
  });

  it("opens the snapshot's entry page for guides introduced later", () => {
    for (const page of [
      "/react/row-spanning/",
      "/angular/formulas/",
      "/angular/pagination/",
      "/ai-integrations/",
    ]) {
      assert.deepEqual(docsVersionTarget(page, "v1", routes), {
        href: "/v1/react/getting-started/",
        samePage: false,
      });
    }
  });

  it("switches between archived versions without doubling the prefix", () => {
    assert.deepEqual(docsVersionTarget("/v1/react/filtering/", "v2", routes), {
      href: "/v2/react/getting-started/",
      samePage: false,
    });
  });

  it("returns to a matching current page or its framework's entry page", () => {
    assert.deepEqual(
      docsVersionTarget("/v2/react/row-spanning/", undefined, routes),
      {
        href: "/react/row-spanning/",
        samePage: true,
      }
    );
    assert.deepEqual(
      docsVersionTarget("/v2/angular/formulas/", undefined, routes),
      {
        href: "/angular/getting-started/",
        samePage: false,
      }
    );
  });

  it("fails when a configured version has no real entry page", () => {
    assert.throws(
      () => docsVersionTarget("/react/filtering/", "v4", routes),
      /No documentation entry page/
    );
  });
});
