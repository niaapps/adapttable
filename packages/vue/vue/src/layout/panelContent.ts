import {
  defineComponent,
  h,
  type PropType,
  shallowRef,
  type VNodeChild,
  watch,
} from "vue";

/** Bound structural content before the kit measures and places its native surface. */
export const PanelContent = defineComponent({
  name: "PanelContent",
  props: {
    modal: Boolean,
    scroll: Boolean,
    anchor: { type: Object as PropType<HTMLElement | null>, default: null },
    children: {
      type: [String, Number, Boolean, Array, Object] as PropType<VNodeChild>,
      default: undefined,
    },
  },
  setup(props) {
    const height = shallowRef<string>("calc(100dvh - 64px)");
    watch(
      [() => props.anchor, () => props.modal],
      ([anchor, modal], _previous, cleanup) => {
        if (modal) {
          height.value = "calc(100dvh - 64px)";
          return;
        }
        const view = anchor?.ownerDocument.defaultView;
        if (!view || !anchor) return;
        const measure = () => {
          const bounds = anchor.getBoundingClientRect();
          const below = Math.max(0, view.innerHeight - bounds.bottom - 16);
          const above = Math.max(0, bounds.top - 16);
          const down = below >= 240 || below >= above;
          // Leave room for vendor card padding, borders and the trigger gap.
          height.value = `${Math.max(0, Math.min(560, down ? below : above) - 48)}px`;
        };
        measure();
        view.addEventListener("resize", measure);
        view.addEventListener("scroll", measure, true);
        const observer = view.ResizeObserver
          ? new view.ResizeObserver(measure)
          : undefined;
        observer?.observe(anchor);
        cleanup(() => {
          view.removeEventListener("resize", measure);
          view.removeEventListener("scroll", measure, true);
          observer?.disconnect();
        });
      },
      { immediate: true, flush: "post" }
    );
    return () =>
      h(
        "div",
        {
          style: {
            display: props.scroll ? "grid" : "flex",
            gap: props.scroll ? "12px" : undefined,
            flexDirection: "column",
            maxHeight: height.value,
            minHeight: 0,
            overflowY: props.scroll ? "auto" : undefined,
          },
        },
        [props.children]
      );
  },
});
