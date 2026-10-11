/** Keep a native surface adjacent to its trigger and inside the viewport. */
export function placeNativeOverlay(
  panel: HTMLElement,
  anchor: HTMLElement,
  dir: "ltr" | "rtl"
): void {
  const view = panel.ownerDocument.defaultView;
  if (!view) return;
  const gutter = 8;
  const gap = 4;
  const bounds = anchor.getBoundingClientRect();
  const viewport =
    panel.ownerDocument.documentElement.clientWidth || view.innerWidth;
  const below = Math.max(0, view.innerHeight - bounds.bottom - gap - gutter);
  const above = Math.max(0, bounds.top - gap - gutter);
  const desired = Math.min(
    560,
    Math.max(panel.scrollHeight, panel.getBoundingClientRect().height)
  );
  const down = below >= Math.min(desired, 240) || below >= above;
  panel.style.position = "fixed";
  panel.style.inset = "auto";
  panel.style.transform = "";
  panel.style.maxWidth = `${Math.max(0, viewport - gutter * 2)}px`;
  panel.style.maxHeight = `${Math.min(560, down ? below : above)}px`;
  const rect = panel.getBoundingClientRect();
  const left = dir === "rtl" ? bounds.left : bounds.right - rect.width;
  const top = down ? bounds.bottom + gap : bounds.top - gap - rect.height;
  panel.style.left = `${Math.max(gutter, Math.min(left, viewport - rect.width - gutter))}px`;
  panel.style.top = `${Math.max(gutter, Math.min(top, view.innerHeight - rect.height - gutter))}px`;
}
