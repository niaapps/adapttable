/** Accessible names for the actual native Brain popover pane. */
import { DOCUMENT } from "@angular/common";
import {
  afterEveryRender,
  DestroyRef,
  Directive,
  inject,
  input,
} from "@angular/core";
import { BrnPopover } from "@spartan-ng/brain/popover";

/** Brain exposes the pane id and state, but no accessible-name input. @internal */
@Directive({ selector: "[brnPopover][adaptHlmPopoverLabel]" })
export class HlmPopoverLabel {
  readonly adaptHlmPopoverLabel = input.required<string>();
  readonly label = this.adaptHlmPopoverLabel;
  private readonly popover = inject(BrnPopover, { self: true });
  private readonly document = inject(DOCUMENT);

  constructor() {
    const update = (): void => {
      const label = this.label();
      if (this.popover.stateComputed() !== "open") return;
      const pane = this.document.getElementById(this.popover.id());
      // Native CDK right offsets use the window viewport. A root scrollbar
      // gutter must not make the top-layer containing block narrower.
      // Only non-flexible hosts span the viewport; other hosts bound the pane.
      const host = pane?.closest<HTMLElement>("[popover]");
      if (host?.style.width === "100%" && this.document.defaultView) {
        const inlineSize = `${String(this.document.defaultView.innerWidth)}px`;
        if (host.style.inlineSize !== inlineSize)
          host.style.setProperty("inline-size", inlineSize, "important");
      }
      // CDK computes physical right offsets against innerWidth. The native
      // top layer's containing block excludes a reserved root gutter, so a
      // right-anchored host otherwise lands one gutter too far left.
      if (host && this.document.defaultView) {
        const rightAnchored =
          host.style.right !== "" &&
          host.style.right !== "auto" &&
          (host.style.left === "" || host.style.left === "auto");
        const gutter = rightAnchored
          ? Math.max(
              0,
              this.document.defaultView.innerWidth -
                this.document.documentElement.getBoundingClientRect().width
            )
          : 0;
        host.style.translate = `${String(gutter)}px`;
      }
      if (pane && pane.getAttribute("aria-label") !== label)
        pane.setAttribute("aria-label", label);
    };
    afterEveryRender(update);
    const viewport = this.document.defaultView;
    viewport?.addEventListener("resize", update);
    inject(DestroyRef).onDestroy(() =>
      viewport?.removeEventListener("resize", update)
    );
  }
}
