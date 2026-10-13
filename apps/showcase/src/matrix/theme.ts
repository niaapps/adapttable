const THEME_KEY = "adapttable-demo-theme";

/** Explicit presentation links take precedence over a remembered preference. */
export function readShowcaseTheme(): boolean {
  const theme = new URLSearchParams(window.location.search).get("theme");
  if (theme === "dark" || theme === "light") return theme === "dark";
  try {
    return window.localStorage.getItem(THEME_KEY) === "dark";
  } catch {
    return false;
  }
}

/** Storage is optional; the rendered theme remains usable without it. */
export function storeShowcaseTheme(dark: boolean): void {
  try {
    window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  } catch {
    // A private browsing context can decline persistence.
  }
}

/** Keep a copied or reloaded link aligned with a deliberate theme change. */
export function updateShowcaseThemeUrl(dark: boolean): void {
  const url = new URL(window.location.href);
  url.searchParams.set("theme", dark ? "dark" : "light");
  window.history.replaceState(window.history.state, "", url);
}
