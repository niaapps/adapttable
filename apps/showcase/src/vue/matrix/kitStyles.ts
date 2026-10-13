/** Global vendor resets must not leak into another kit after a demo switch. */
const styles = new Map<string, HTMLStyleElement>();
let activeKit: string | undefined;

export function registerKitStyles(key: string, css: string): void {
  if (styles.has(key)) return;
  const style = document.createElement("style");
  style.dataset.vueKitStyles = key;
  style.media = activeKit === key ? "all" : "not all";
  style.textContent = css;
  document.head.append(style);
  styles.set(key, style);
}

export function activateKitStyles(key: string): void {
  activeKit = key;
  for (const [kit, style] of styles)
    style.media = kit === key ? "all" : "not all";
}
