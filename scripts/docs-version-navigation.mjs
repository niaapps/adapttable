/**
 * Choose an existing documentation page when switching versions. A snapshot
 * predates some guides and frameworks, so prefixing the current path is unsafe.
 *
 * @param {string} pathname
 * @param {string | undefined} version
 * @param {Set<string>} routes existing absolute paths, with trailing slashes
 * @returns {{ href: string, samePage: boolean }}
 */
export function docsVersionTarget(pathname, version, routes) {
  const canonical = pathname.replace(/^\/v\d+(?=\/)/, "");
  const prefix = version ? `/${version}` : "";
  const requested = `${prefix}${canonical}`;
  if (routes.has(requested)) return { href: requested, samePage: true };
  const framework = /^\/(react|angular|vue)\//.exec(canonical)?.[1] ?? "react";
  for (const candidate of [
    `${prefix}/${framework}/getting-started/`,
    `${prefix}/react/getting-started/`,
  ]) {
    if (routes.has(candidate)) return { href: candidate, samePage: false };
  }
  throw new Error(
    `No documentation entry page exists for ${version ?? "current"}`
  );
}
