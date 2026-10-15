// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { focusEditorOnMount } from "./editableCell";
import { preserveEditorFocusOnLayoutChange } from "./layoutFocus";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});
function fixture() {
  document.body.innerHTML =
    '<button id="layout">Layout</button><div data-adapttable-part="root"><input data-adapttable-part="edit-cell-editor" value="first"><input data-adapttable-part="edit-cell-editor" value="draft text"></div>';
  const root = document.querySelector<HTMLElement>(
    '[data-adapttable-part="root"]'
  )!;
  const active = root.querySelectorAll("input")[1]!;
  active.focus();
  active.setSelectionRange(2, 7);
  const frames: FrameRequestCallback[] = [];
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((fn) => {
    frames.push(fn);
    return frames.length;
  });
  return {
    root,
    active,
    paint: () => {
      while (frames.length) frames.shift()!(0);
    },
  };
}
describe("responsive editor focus", () => {
  it("restores the same editor and caret after the body is replaced", () => {
    const { root, paint } = fixture();
    preserveEditorFocusOnLayoutChange();
    root.replaceChildren(
      ...[...root.children].map((child) => child.cloneNode(true))
    );
    paint();
    const restored = root.querySelectorAll("input")[1]!;
    expect(document.activeElement).toBe(restored);
    expect(restored.selectionStart).toBe(2);
    expect(restored.selectionEnd).toBe(7);
  });
  it("keeps the first snapshot when several subscribers observe one change", () => {
    const { root, paint } = fixture();
    preserveEditorFocusOnLayoutChange();
    root.replaceChildren(
      ...[...root.children].map((child) => child.cloneNode(true))
    );
    root.querySelector("input")!.focus();
    preserveEditorFocusOnLayoutChange();
    paint();
    expect(document.activeElement).toBe(root.querySelectorAll("input")[1]);
  });
  it("never steals focus from a layout chooser or another table", () => {
    const { root, paint } = fixture();
    preserveEditorFocusOnLayoutChange();
    root.replaceChildren(
      ...[...root.children].map((child) => child.cloneNode(true))
    );
    const chooser = document.querySelector<HTMLButtonElement>("#layout")!;
    chooser.focus();
    focusEditorOnMount(root.querySelector("input"));
    paint();
    expect(document.activeElement).toBe(chooser);
  });
  it("does not guess a field after the editor inventory changes", () => {
    const { root, paint } = fixture();
    preserveEditorFocusOnLayoutChange();
    root.replaceChildren(document.createElement("input"));
    paint();
    expect(document.activeElement).toBe(document.body);
  });
  it.each(["input", "nativeElement"])(
    "respects outside focus through a kit's %s handle",
    (key) => {
      const { root } = fixture();
      const chooser = document.querySelector<HTMLButtonElement>("#layout")!;
      const input = root.querySelector("input")!;
      const focus = vi.fn(() => input.focus());
      chooser.focus();
      focusEditorOnMount({ focus, [key]: input });
      expect(focus).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(chooser);
      document.body.focus();
      chooser.blur();
      focusEditorOnMount({ focus, [key]: input });
      expect(focus).toHaveBeenCalledOnce();
    }
  );
  it("leaves an editor that remains mounted untouched", () => {
    const { active, paint } = fixture();
    preserveEditorFocusOnLayoutChange();
    paint();
    expect(document.activeElement).toBe(active);
  });
});
