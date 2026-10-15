import type { DataTableSlots } from "@adapttable/vue/adapter";
import { expect, it } from "vitest";
import { createApp, h, nextTick, shallowRef } from "vue";

import { DataTable } from "../src";
import { rowDetail } from "../src/row-detail";

interface Row {
  id: string;
  name: string;
  team: string;
}
type CardContext = Parameters<NonNullable<DataTableSlots<Row>["card"]>>[0];

it("keeps native selection and prepared values when the custom mobile body changes", async () => {
  const custom = shallowRef(true);
  const root = document.createElement("div");
  document.body.append(root);
  const renders: {
    selected: boolean;
    expanded: boolean;
    labels: readonly string[];
  }[] = [];
  const app = createApp({
    setup() {
      return () =>
        h(
          DataTable<Row>,
          {
            data: [{ id: "a", name: "Ada", team: "Core" }],
            columns: [
              { key: "name", header: "Full name" },
              { key: "team", mobileLabel: "Team tile" },
              { key: "id" },
            ],
            rowKey: (row) => row.id,
            forceMobile: true,
            selectable: true,
            urlSync: false,
            maxHeight: 240,
            features: [
              rowDetail<Row>((row) => h("p", `Details for ${row.name}`), ["a"]),
            ],
          },
          custom.value
            ? {
                card: ({ fields, selected, expanded }: CardContext) => {
                  renders.push({
                    selected,
                    expanded,
                    labels: fields.map((field) => field.label),
                  });
                  return h(
                    "section",
                    { "data-custom-body": "" },
                    fields.map((field) => h("div", [field.label, field.value]))
                  );
                },
              }
            : {}
        );
    },
  });
  try {
    app.mount(root);
    await nextTick();
    expect(root.querySelector("[data-custom-body]")?.textContent).toContain(
      "Ada"
    );
    expect(renders.at(-1)?.labels).toEqual(["Full name", "Team tile", "Id"]);
    const checkbox = root.querySelector<HTMLElement>(
      '[data-row-id="a"] [role="checkbox"], [data-row-id="a"] input[type="checkbox"]'
    );
    expect(checkbox).not.toBeNull();
    checkbox!.click();
    await nextTick();
    expect(renders.at(-1)?.selected).toBe(true);
    expect(renders.at(-1)?.expanded).toBe(true);
    expect(
      root.querySelector('[data-adapttable-part="card-detail"]')?.textContent
    ).toContain("Details for Ada");
    const toggle = root.querySelector<HTMLButtonElement>(
      '[data-adapttable-part="expand-button"]'
    );
    expect(toggle).not.toBeNull();
    toggle!.click();
    await nextTick();
    expect(renders.at(-1)?.expanded).toBe(false);
    custom.value = false;
    await nextTick();
    expect(root.querySelector("[data-custom-body]")).toBeNull();
    expect(root.querySelector('[data-row-id="a"]')?.textContent).toContain(
      "Ada"
    );
    expect(
      root
        .querySelector('[data-adapttable-part="scroll-box"]')
        ?.getAttribute("tabindex")
    ).toBe("0");
  } finally {
    app.unmount();
    root.remove();
  }
});
