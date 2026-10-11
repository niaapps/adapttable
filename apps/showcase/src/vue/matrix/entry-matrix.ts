/**
 * The one entry every Vue kit's matrix page boots — the Vue counterpart of
 * `src/entry-matrix.tsx` and `src/angular/entry-matrix.ts`.
 *
 * Which page this is comes from `#root`'s `data-matrix-page`, written into the
 * served HTML by `scripts/build-showcase-html.mjs` as the page's path under the
 * Vue demo root, so the dev server (`/vue/unstyled/filtering/`) and the
 * published site (`/vue/demo/unstyled/filtering/`) boot the same file.
 */
import "../../styles.css";
import "../../angular/matrixPage.css";
import "./matrixPage.css";

import { createApp, h } from "vue";

import { resolveMatrixRoute } from "../../matrix/content";
import { SHOWCASE_PRESENTATION } from "./data";
import { loadVueShowcaseKit } from "./loadKit";
import MatrixPage from "./MatrixPage.vue";
import { SHOWCASE_KIT } from "./showcaseKit";

document.documentElement.dataset.framework = "vue";

const container = document.getElementById("root");
if (!container) throw new Error("the showcase page has no #root to mount into");

/** The framework this entry serves: the kits whose matrix pages boot it. */
const FRAMEWORK = "vue";

const id = container.dataset.matrixPage ?? "";
const route = resolveMatrixRoute(id, FRAMEWORK);
if (!route) {
  // The page's static copy stays on screen rather than being replaced by a
  // blank root, and the fault is reported instead of being swallowed.
  throw new Error(
    `the matrix does not build a ${FRAMEWORK} page called "${id}"`
  );
}

const { kit } = await loadVueShowcaseKit(route.adapter.key);

const dark = (() => {
  try {
    return window.localStorage.getItem("adapttable-demo-theme") === "dark";
  } catch {
    // Storage can be unavailable (private mode): the page opens light.
    return false;
  }
})();

const app = createApp({ render: () => h(MatrixPage, { route }) });
app.provide(SHOWCASE_KIT, kit);
kit.install?.(app, {
  dark,
  dir: SHOWCASE_PRESENTATION.dir,
  locale: SHOWCASE_PRESENTATION.locale,
});
container.replaceChildren();
app.mount(container);
