/** Framework-aware navigation shared by documentation, landing, and demos. */
import { sidebarPages } from "../apps/docs/sidebar.mjs";
import { ANGULAR_DOCS } from "./angular-docs.mjs";
import { docsRoute, SHARED_DOCS } from "./site.mjs";
import { VUE_DOCS } from "./vue-docs.mjs";

/** Published framework choices for documentation, landing pages and demos. */
export const SITE_FRAMEWORKS = Object.freeze([
  { key: "react", label: "React", icon: "⚛" },
  { key: "angular", label: "Angular", icon: "Ⓐ" },
  { key: "vue", label: "Vue", icon: "V" },
]);
export const DOCS_FRAMEWORKS = SITE_FRAMEWORKS;
export const FRAMEWORK_STORAGE_KEY = "adapttable-framework";
/** @param {string | null} value */
export function normalizeFramework(value) {
  return value === "angular" || value === "vue" ? value : "react";
}
const angular = new Set(ANGULAR_DOCS.map((page) => page.replace(/\.md$/, "")));
const vue = new Set(VUE_DOCS.map((page) => page.replace(/\.md$/, "")));
const shared = new Set(SHARED_DOCS);
// This module also runs in the browser. Reuse the rendered sidebar inventory
// rather than inventing a React page for every framework-specific basename.
const react = new Set(
  sidebarPages()
    .map(({ slug }) => slug)
    .filter((slug) => !/^(angular|vue)\//.test(slug))
    .map((slug) => slug.replace(/^react\//, ""))
);

/** @param {string} path @param {string | null} [preferred] */
export function selectedFramework(path, preferred = null) {
  const explicit = /^\/(react|angular|vue)(?:\/|$)/.exec(path)?.[1];
  return explicit ?? normalizeFramework(preferred);
}

/** A destination includes an explicit explanation when no equivalent exists.
 * @param {string} path @param {string} framework
 */
export function frameworkDocsTarget(path, framework) {
  framework = normalizeFramework(framework);
  const slug = path
    .replace(/^\/v\d+\//, "/")
    .replace(/^\/(react|angular|vue)\//, "/")
    .split("/")
    .filter(Boolean)
    .join("/")
    .replace(/\.md$/, "");
  if (framework === "angular" && angular.has(`angular/${slug}`))
    return { href: docsRoute(`angular/${slug}`), equivalent: true };
  if (framework === "vue" && vue.has(`vue/${slug}`))
    return { href: docsRoute(`vue/${slug}`), equivalent: true };
  if (shared.has(slug)) return { href: docsRoute(slug), equivalent: true };
  if (framework === "react" && react.has(slug || "getting-started"))
    return { href: docsRoute(slug || "getting-started"), equivalent: true };
  return {
    href: `${docsRoute("getting-started", framework)}?unavailable=${encodeURIComponent(slug)}`,
    equivalent: false,
  };
}

/** @type {Readonly<Record<string, Readonly<Record<string, string>>>>} */
const KIT_COUNTERPARTS = {
  vue: {
    tailwind: "vue-unstyled",
    unstyled: "vue-unstyled",
    mui: "vuetify",
    material: "vuetify",
    shadcn: "shadcn-vue",
    spartan: "shadcn-vue",
    radix: "reka-ui",
  },
  angular: {
    antd: "ng-zorro",
    mui: "material",
    shadcn: "spartan",
    tailwind: "unstyled",
    "vue-unstyled": "unstyled",
    vuetify: "material",
    "shadcn-vue": "spartan",
  },
  react: {
    "ng-zorro": "antd",
    material: "mui",
    spartan: "shadcn",
    unstyled: "tailwind",
    "vue-unstyled": "tailwind",
    vuetify: "mui",
    "shadcn-vue": "shadcn",
  },
};
/** @param {string} framework */
const defaultKit = (framework) => {
  if (framework === "vue") return "vue-unstyled";
  return framework === "angular" ? "unstyled" : "tailwind";
};
/** @param {string} key @param {string} framework */
const matchingKey = (key, framework) =>
  KIT_COUNTERPARTS[framework]?.[key] ?? key;
/** @template {{key: string, framework: string, built?: boolean, path?: string}} T
 * @param {readonly T[]} adapters @param {string} framework @param {string} key */
const findKit = (adapters, framework, key) =>
  adapters.find(
    (item) =>
      item.framework === framework && item.built !== false && item.key === key
  );

/** @param {URL} url */
function demoParts(url) {
  const parts = url.pathname
    .replace(/^\/(react|angular|vue)\/demo\/?/, "")
    .replace(/^\/vue\//, "")
    .split("/")
    .filter(Boolean);
  if (parts[0] === "angular-main") parts.length = 0;
  if (parts[0] === "angular-all-options") parts[0] = "all-options";
  if (parts[0] === "vue-main") parts.length = 0;
  if (parts[0] === "vue-all-options") parts[0] = "all-options";
  return parts;
}
/** Only presentation preferences cross pages; table queries belong to one demo.
 * @param {URL} url */
function presentationQuery(url) {
  const query = new URLSearchParams();
  for (const key of ["locale", "dir", "density", "mobile", "theme"]) {
    const value = url.searchParams.get(key);
    if (value !== null) query.set(key, value);
  }
  return query;
}
/** @param {string} framework @param {boolean} lab @param {boolean} deployed */
function modePath(framework, lab, deployed) {
  if (deployed) return `/${framework}/demo/${lab ? "all-options/" : ""}`;
  if (framework === "angular")
    return lab ? "/angular-all-options/" : "/angular-main/";
  if (framework === "vue") return lab ? "/vue-all-options/" : "/vue-main/";
  return lab ? "/all-options/" : "/";
}
/** @template {{key: string, framework: string, built?: boolean, path?: string}} T
 * @param {URL} url @param {string} framework @param {readonly T[]} adapters
 * @param {boolean} lab @param {boolean} deployed */
function demoModeTarget(url, framework, adapters, lab, deployed) {
  const query = new URLSearchParams();
  const selectedKit = url.searchParams.get("kit");
  if (selectedKit) {
    const kit = findKit(
      adapters,
      framework,
      matchingKey(selectedKit, framework)
    );
    query.set("kit", kit?.key ?? defaultKit(framework));
    if (!kit) query.set("kit-unavailable", selectedKit);
    else query.delete("kit-unavailable");
  }
  for (const [key, value] of presentationQuery(url)) query.set(key, value);
  const destination = modePath(framework, lab, deployed);
  return {
    href: destination + (query.size ? `?${query}` : ""),
    equivalent: !query.has("kit-unavailable") && !query.has("unavailable"),
  };
}

/** Preserve matching kit, feature and presentation on local and published pages.
 * @param {string} path @param {string} framework
 * @template {{key: string, framework: string, built?: boolean, path?: string}} T
 * @param {readonly T[]} adapters
 * @param {(adapter: T) => readonly {slug: string}[]} features
 */
export function frameworkDemoTarget(path, framework, adapters, features) {
  framework = normalizeFramework(framework);
  const url = new URL(path, "https://adapttable.local");
  const deployed = /^\/(react|angular|vue)\/demo(?:\/|$)/.test(url.pathname);
  const parts = demoParts(url);
  if (parts.length === 0 || parts[0] === "all-options")
    return demoModeTarget(
      url,
      framework,
      adapters,
      parts[0] === "all-options",
      deployed
    );
  const sourceKit = parts[0] ?? "";
  const counterpart = matchingKey(sourceKit, framework);
  const kit =
    findKit(adapters, framework, counterpart) ??
    findKit(adapters, framework, defaultKit(framework));
  if (!kit)
    return { href: `/${framework}/getting-started/`, equivalent: false };
  const feature = parts[1];
  const supported =
    !feature || features(kit).some((item) => item.slug === feature);
  const kitPath = kit.path ?? kit.key;
  const localBase = framework === "vue" ? `/vue/${kitPath}/` : `/${kitPath}/`;
  const base = deployed ? `/${framework}/demo/${kitPath}/` : localBase;
  const suffix = feature ? feature + "/" : "";
  const equivalentKit = kit.key === counterpart;
  const query = presentationQuery(url);
  query.delete("unavailable");
  query.delete("kit-unavailable");
  if (!supported) query.set("unavailable", feature);
  if (!equivalentKit) query.set("kit-unavailable", sourceKit);
  const destination = supported ? base + suffix : base;
  return {
    href: destination + (query.size ? `?${query}` : ""),
    equivalent: supported && equivalentKit,
  };
}
