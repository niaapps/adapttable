import { useEffect, useState } from "react";

/** Budget content before Ant Design chooses the popup's native placement. */
export function usePopoverHeight(
  open: boolean,
  origin: () => HTMLElement | null | undefined,
  padding = 24
): number {
  const [height, setHeight] = useState(360);
  useEffect(() => {
    const anchor = origin();
    const view = anchor?.ownerDocument.defaultView;
    if (!open || !anchor || !view) return;
    const measure = () => {
      const rect = anchor.getBoundingClientRect();
      const below = Math.max(0, view.innerHeight - rect.bottom - 48);
      const above = Math.max(0, rect.top - 48);
      const room = below >= 240 || below >= above ? below : above;
      setHeight(Math.max(0, Math.min(560, room) - padding));
    };
    measure();
    view.addEventListener("resize", measure);
    view.addEventListener("scroll", measure, true);
    const observer = view.ResizeObserver
      ? new view.ResizeObserver(measure)
      : undefined;
    observer?.observe(anchor);
    return () => {
      view.removeEventListener("resize", measure);
      view.removeEventListener("scroll", measure, true);
      observer?.disconnect();
    };
  }, [open, origin, padding]);
  return height;
}
