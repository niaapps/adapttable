import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import type * as Jsdom from "jsdom";

const root = process.cwd();
const require = createRequire(join(root, "package.json"));
const { build } = (await import(
  pathToFileURL(require.resolve("vite")).href
)) as {
  build(
    this: void,
    options: { root: string; logLevel: string }
  ): Promise<unknown>;
};
await build({ root, logLevel: "warn" });

const { JSDOM, VirtualConsole } = require("jsdom") as typeof Jsdom;
const errors: string[] = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (error) => errors.push(error.message));
const dom = new JSDOM(readFileSync(join(root, "dist/index.html"), "utf8"), {
  url: "http://localhost/",
  pretendToBeVisual: true,
  virtualConsole,
});
const window = dom.window;
for (const name of [
  "window",
  "document",
  "navigator",
  "location",
  "history",
  "localStorage",
  "sessionStorage",
  "Node",
  "Element",
  "HTMLElement",
  "SVGElement",
  "Document",
  "DocumentFragment",
  "ShadowRoot",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "CustomEvent",
  "MutationObserver",
  "HTMLInputElement",
  "HTMLButtonElement",
  "HTMLSelectElement",
  "HTMLTextAreaElement",
  "HTMLDialogElement",
  "XMLHttpRequest",
  "FileList",
  "Storage",
  "HTMLLabelElement",
])
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: window[name],
  });
for (const name of [
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "getComputedStyle",
  "addEventListener",
  "removeEventListener",
]) {
  const method = window[name] as (...args: unknown[]) => unknown;
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: method.bind(window),
  });
}

// Layout observation only; rendering, native providers and sort state are real.
class LayoutObserver {
  targets = new Set<Element>();
  observe(target: Element) {
    this.targets.add(target);
  }
  unobserve(target: Element) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
  }
}
Object.defineProperty(globalThis, "ResizeObserver", {
  configurable: true,
  value: LayoutObserver,
});
/** jsdom has no media-query or CSS-layout engine. */
function matchMedia(media: string) {
  const target = new window.EventTarget();
  return {
    media,
    matches: false,
    onchange: null,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    addListener: (listener: EventListener) =>
      target.addEventListener("change", listener),
    removeListener: (listener: EventListener) =>
      target.removeEventListener("change", listener),
    dispatchEvent: target.dispatchEvent.bind(target),
  };
}
Object.defineProperty(globalThis, "matchMedia", {
  configurable: true,
  value: matchMedia,
});
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: matchMedia,
});
Object.defineProperty(globalThis, "CSS", {
  configurable: true,
  value: { supports: () => false },
});
Object.defineProperty(window.screen, "orientation", {
  configurable: true,
  value: Object.assign(new window.EventTarget(), {
    angle: 0,
    type: "landscape-primary",
  }),
});
const originalError = console.error;
console.error = (...args: unknown[]) => {
  errors.push(args.map(String).join(" "));
  originalError(...args);
};

async function until(predicate: () => boolean) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.ok(predicate(), "Built app did not reach its expected rendered state");
}

try {
  const script = window.document.querySelector('script[type="module"][src]');
  assert.ok(script);
  const entry = script.getAttribute("src");
  assert.ok(entry);
  await import(
    pathToFileURL(join(root, "dist", entry.replace(/^\//, ""))).href
  );
  const document = window.document;
  await until(
    () => document.querySelectorAll('[data-adapttable-part="row"]').length === 3
  );
  const rows = () =>
    [...document.querySelectorAll('[data-adapttable-part="row"]')].map((row) =>
      [...row.querySelectorAll('[data-adapttable-part="cell"]')].map((cell) =>
        cell.textContent.trim()
      )
    );
  const initialRows = rows();
  const nameHeader = [
    ...document.querySelectorAll('[data-adapttable-part="header-cell"]'),
  ].find((header) => header.textContent.trim() === "Name");
  assert.ok(nameHeader);
  const sort = nameHeader.querySelector("button");
  assert.ok(sort);
  sort.click();
  await until(() => nameHeader.getAttribute("aria-sort") === "ascending");
  sort.click();
  await until(() => nameHeader.getAttribute("aria-sort") === "descending");
  writeFileSync(
    join(root, "rendered.json"),
    JSON.stringify({
      initialRows,
      descendingRows: rows(),
      sortClass: sort.className,
      tableCount: document.querySelectorAll('[data-adapttable-part="table"]')
        .length,
      errors,
    })
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  console.error = originalError;
  dom.window.close();
}
