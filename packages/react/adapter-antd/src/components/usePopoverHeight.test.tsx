import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { usePopoverHeight } from "./usePopoverHeight";

afterEach(() => vi.restoreAllMocks());

it("measures the anchor, responds to viewport changes and disconnects its observer", () => {
  const anchor = document.createElement("button");
  let top = 100;
  const bounds = vi
    .spyOn(anchor, "getBoundingClientRect")
    .mockImplementation(() => ({ top, bottom: top + 40 }) as DOMRect);
  vi.spyOn(window, "innerHeight", "get").mockReturnValue(720);
  let resize: () => void = vi.fn();
  const observe = vi.fn();
  const disconnect = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback;
      }
      observe = observe;
      disconnect = disconnect;
    }
  );
  const origin = () => anchor;
  const { result, unmount } = renderHook(() => usePopoverHeight(true, origin));
  expect(result.current).toBe(508);
  expect(observe).toHaveBeenCalledWith(anchor);
  top = 600;
  act(() => window.dispatchEvent(new Event("scroll")));
  expect(result.current).toBe(528);
  top = 320;
  act(() => window.dispatchEvent(new Event("resize")));
  expect(result.current).toBe(288);
  top = 700;
  act(resize);
  expect(result.current).toBe(536);
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
  const calls = bounds.mock.calls.length;
  window.dispatchEvent(new Event("scroll"));
  expect(bounds).toHaveBeenCalledTimes(calls);
  vi.unstubAllGlobals();
});

it("stays passive while closed or without a browser anchor and works without ResizeObserver", () => {
  const anchor = document.createElement("button");
  vi.spyOn(window, "innerHeight", "get").mockReturnValue(200);
  vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue({
    top: 100,
    bottom: 140,
  } as DOMRect);
  vi.stubGlobal("ResizeObserver", undefined);
  const origin = () => anchor;
  const { result, rerender } = renderHook(
    ({ open }) => usePopoverHeight(open, origin, 120),
    { initialProps: { open: false } }
  );
  expect(result.current).toBe(360);
  rerender({ open: true });
  expect(result.current).toBe(0);
  expect(
    renderHook(() => usePopoverHeight(true, () => null)).result.current
  ).toBe(360);
  const detached = document.implementation
    .createHTMLDocument()
    .createElement("button");
  expect(
    renderHook(() => usePopoverHeight(true, () => detached)).result.current
  ).toBe(360);
  vi.unstubAllGlobals();
});
