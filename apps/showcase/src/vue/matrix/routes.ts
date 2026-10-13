/**
 * Addresses inside the site from a Vue page. The dev server serves the Vue
 * pages from the showcase's `vue/` folder; the composed site serves the same
 * pages under `/vue/demo/`. Both spell a kit's page the same below that root.
 */
import {
  featuresOf,
  SHOWCASE_ADAPTERS,
} from "../../../../../apps/showcase/matrix.mjs";
import {
  frameworkDemoTarget,
  showcasePageHref,
} from "../../../../../scripts/framework-navigation.mjs";

const DEPLOYED = /^\/vue\/demo(?:\/|$)/.test(window.location.pathname);

/** A Vue demo page, by its path under the Vue demo root. */
const vuePath = (page = ""): string => {
  if (!page) return DEPLOYED ? "/vue/demo/" : "/vue-main/";
  if (page === "all-options")
    return DEPLOYED ? "/vue/demo/all-options/" : "/vue-all-options/";
  const root = DEPLOYED ? "/vue/demo/" : "/vue/";
  return page ? `${root}${page}/` : root;
};

export const vueHref = (page = ""): string =>
  showcasePageHref(vuePath(page), window.location.href);

/** A file at the root of the demo the page is served from. */
export const demoFileHref = (file: string): string =>
  `${DEPLOYED ? "/vue/demo/" : "/"}${file}`;

/** Another framework's live demo. */
export const frameworkDemoHref = (framework: "react" | "angular"): string => {
  return frameworkDemoTarget(
    window.location.pathname + window.location.search,
    framework,
    SHOWCASE_ADAPTERS,
    featuresOf
  ).href;
};
