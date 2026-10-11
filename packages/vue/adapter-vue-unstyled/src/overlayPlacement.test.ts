import { afterEach, describe, expect, it, vi } from "vitest";

import { placeNativeOverlay } from "./overlayPlacement";

afterEach(() => vi.restoreAllMocks());
function fixture(top = 180, left = 400, width = 360, height = 600) {
  const anchor = document.createElement("button");
  const panel = document.createElement("div");
  vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue(
    new DOMRect(left, top, 80, 36)
  );
  Object.defineProperty(panel, "scrollHeight", { value: height });
  vi.spyOn(panel, "getBoundingClientRect").mockImplementation(
    () =>
      new DOMRect(
        0,
        0,
        width,
        Math.min(height, Number.parseFloat(panel.style.maxHeight) || height)
      )
  );
  return { panel, anchor };
}
describe("native overlay placement", () => {
  it("keeps a tall form below its trigger when a useful scrolling surface fits", () => {
    const { panel, anchor } = fixture();
    placeNativeOverlay(panel, anchor, "ltr");
    expect(panel.style.top).toBe("220px");
    expect(panel.style.left).toBe("120px");
    expect(panel.style.maxHeight).toBe("540px");
    expect(panel.style.position).toBe("fixed");
  });
  it("flips above a low trigger and uses its start edge in RTL", () => {
    const { panel, anchor } = fixture(700, 400, 360, 300);
    placeNativeOverlay(panel, anchor, "rtl");
    expect(panel.style.top).toBe("396px");
    expect(panel.style.left).toBe("400px");
    expect(panel.style.maxHeight).toBe("560px");
  });
  it("clamps both horizontal edges and a trigger outside the viewport", () => {
    const first = fixture(180, -100, 200, 100);
    placeNativeOverlay(first.panel, first.anchor, "ltr");
    expect(first.panel.style.left).toBe("8px");
    const second = fixture(180, 1000, 200, 100);
    placeNativeOverlay(second.panel, second.anchor, "rtl");
    expect(second.panel.style.left).toBe(`${window.innerWidth - 208}px`);
    const third = fixture(-100, 20, 200, 100);
    placeNativeOverlay(third.panel, third.anchor, "ltr");
    expect(third.panel.style.top).toBe("8px");
  });
  it("uses the document viewport and tolerates a document without a window", () => {
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
      390
    );
    const { panel, anchor } = fixture(180, 350, 360, 100);
    placeNativeOverlay(panel, anchor, "ltr");
    expect(panel.style.maxWidth).toBe("374px");
    expect(panel.style.left).toBe("22px");
    const detached = document.implementation
      .createHTMLDocument()
      .createElement("div");
    placeNativeOverlay(detached, anchor, "ltr");
    expect(detached.style.position).toBe("");
  });
});
