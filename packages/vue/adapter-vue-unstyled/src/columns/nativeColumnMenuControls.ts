import type {
  ColumnMenuButtonProps,
  ColumnMenuSlots,
} from "@adapttable/vue/adapter";
import { h, mergeProps, type VNode } from "vue";

import { NativeColumnMenuPanel } from "./NativeColumnMenuPanel";

function button({ attrs, label, icon }: ColumnMenuButtonProps): VNode {
  const icons = {
    grip: "M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01",
    visible:
      "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
    hidden: "M3 3l18 18M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z",
    pin: "M8 3h8v6l2 3v2H6v-2l2-3V3ZM12 14v7",
    more: "M5 12h.01M12 12h.01M19 12h.01",
    rename: "m15 5 4 4M4 20l4-1L20 7l-4-4L4 15v5Z",
  };
  return h(
    "button",
    mergeProps(
      attrs,
      icon
        ? {
            style: {
              width: "36px",
              height: "36px",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            },
          }
        : {}
    ),
    icon
      ? [
          h(
            "svg",
            {
              "aria-hidden": true,
              width: 18,
              height: 18,
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              "stroke-width": icon === "grip" || icon === "more" ? 3 : 1.75,
              "stroke-linecap": "round",
              "stroke-linejoin": "round",
            },
            [h("path", { d: icons[icon] })]
          ),
        ]
      : label
  );
}
/** Native controls forward every semantic attribute to its actual element. */
export const nativeColumnMenuSlots: ColumnMenuSlots = {
  Trigger: button,
  Button: button,
  Input: ({ attrs, value, onChange }) =>
    h(
      "input",
      mergeProps(attrs, {
        value,
        style: {
          width: "100%",
          minHeight: "36px",
          padding: "6px 8px",
          boxSizing: "border-box",
        },
        onInput: (event: Event): void => {
          const target = event.currentTarget;
          if (target instanceof HTMLInputElement) onChange(target.value);
        },
      })
    ),
  Choice: ({ attrs, value, options, onChange }) =>
    h(
      "select",
      mergeProps(attrs, {
        value,
        onChange: (event: Event): void => {
          const target = event.currentTarget;
          if (!(target instanceof HTMLSelectElement)) return;
          onChange(target.value);
          target.value = value;
        },
      }),
      options.map((option) =>
        h(
          "option",
          {
            key: option.value,
            value: option.value,
            selected: option.value === value,
          },
          option.label
        )
      )
    ),
  Panel: (control) => h(NativeColumnMenuPanel, { control }),
};
