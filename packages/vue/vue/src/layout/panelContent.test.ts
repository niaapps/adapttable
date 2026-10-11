import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, h, nextTick, shallowRef, type VNodeChild } from "vue";

import { PanelContent } from "./panelContent";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function mountContent(props: {
  anchor?: HTMLElement | null;
  modal?: boolean;
  children?: VNodeChild;
}) {
  const options = shallowRef(props);
  const root = document.createElement("div");
  const app = createApp({
    setup: () => () => h(PanelContent, options.value),
  });
  app.mount(root);
  const element = root.firstElementChild;
  if (!(element instanceof HTMLElement))
    throw new Error("Missing content wrapper");
  return {
    element,
    text: () => element.textContent,
    unmount: () => app.unmount(),
    setProps: async (patch: typeof props) => {
      options.value = { ...options.value, ...patch };
      await nextTick();
    },
  };
}
describe("filter content viewport budget", () => {
  it("reserves card chrome, measures scrolling and resize, then releases its observer", async () => {
    let top = 180;
    let bottom = 216;
    const anchor = document.createElement("button");
    vi.spyOn(anchor, "getBoundingClientRect").mockImplementation(
      () => new DOMRect(0, top, 80, bottom - top)
    );
    let resize: ResizeObserverCallback | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = callback;
        }
        observe = observe;
        disconnect = disconnect;
      }
    );
    const view = mountContent({ anchor, children: h("span", "Fields") });
    await nextTick();
    expect(view.element.style.maxHeight).toBe("488px");
    expect(observe).toHaveBeenCalledWith(anchor);
    top = 700;
    bottom = 736;
    window.dispatchEvent(new Event("scroll"));
    await nextTick();
    expect(view.element.style.maxHeight).toBe("512px");
    top = 100;
    bottom = 136;
    window.dispatchEvent(new Event("resize"));
    await nextTick();
    expect(view.element.style.maxHeight).toBe("512px");
    top = -100;
    bottom = 900;
    resize?.([], {} as ResizeObserver);
    await nextTick();
    expect(view.element.style.maxHeight).toBe("0px");
    await view.setProps({ anchor: null });
    expect(disconnect).toHaveBeenCalledOnce();
    view.unmount();
  });
  it("renders server-safe content without an anchor or observer", async () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const view = mountContent({ children: "Fields" });
    expect(view.text()).toBe("Fields");
    expect(view.element.style.maxHeight).toBe("calc(100dvh - 64px)");
    await view.setProps({ anchor: document.createElement("button") });
    expect(view.element.style.maxHeight).toBe("512px");
    await view.setProps({ modal: true });
    expect(view.element.style.maxHeight).toBe("calc(100dvh - 64px)");
    view.unmount();
  });
});
