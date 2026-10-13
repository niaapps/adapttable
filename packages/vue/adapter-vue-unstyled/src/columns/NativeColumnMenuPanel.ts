import type { ColumnMenuSlots } from "@adapttable/vue/adapter";
import {
  defineComponent,
  h,
  mergeProps,
  onMounted,
  onScopeDispose,
  onUpdated,
  type PropType,
  type VNode,
} from "vue";

import { placeNativeOverlay } from "../overlayPlacement";

type PanelControl = Parameters<ColumnMenuSlots["Panel"]>[0];
/** Inline native surface: retain fullscreen ancestry and clamp to the viewport. */
export const NativeColumnMenuPanel = defineComponent(
  (props: { readonly control: PanelControl }) => {
    let panel: HTMLElement | null = null;
    let detach: (() => void) | undefined;
    const place = (): void => {
      if (!panel) return;
      const anchor = props.control.anchor;
      if (anchor)
        placeNativeOverlay(
          panel,
          anchor,
          props.control.attrs.dir === "rtl" ? "rtl" : "ltr"
        );
    };
    onMounted(() => {
      const view = panel?.ownerDocument.defaultView;
      if (!view) return;
      place();
      const observer = view.ResizeObserver
        ? new view.ResizeObserver(place)
        : undefined;
      if (panel) observer?.observe(panel);
      view.addEventListener("resize", place);
      view.addEventListener("scroll", place, true);
      detach = () => {
        observer?.disconnect();
        view.removeEventListener("resize", place);
        view.removeEventListener("scroll", place, true);
      };
    });
    onUpdated(place);
    onScopeDispose(() => {
      detach?.();
      panel = null;
    });
    return () =>
      h(
        "div",
        mergeProps(props.control.attrs, {
          style: {
            inlineSize: "360px",
            boxSizing: "border-box",
            padding: "16px",
            display: "grid",
            overflowY: "auto",
            gap: "12px",
            zIndex: 10050,
          },
          onVnodeMounted: (node: VNode): void => {
            panel = node.el instanceof HTMLElement ? node.el : null;
          },
        }),
        [props.control.content]
      );
  },
  {
    name: "NativeColumnMenuPanel",
    props: {
      control: { type: Object as PropType<PanelControl> },
    },
  }
);
