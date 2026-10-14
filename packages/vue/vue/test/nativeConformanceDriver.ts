/** A Vue mount adapter for the unchanged framework-neutral behavioral suite. */
import { defaultLabels } from "@adapttable/core";
import {
  CONFORMANCE_COLUMNS,
  CONFORMANCE_ROWS,
  type ConformanceDriver,
  type ConformanceMount,
  type ConformanceRow,
  type ConformanceScenario,
  type ConformanceTest,
} from "@adapttable/core/conformance";
import { expect, vi } from "vitest";
import { type App, createApp, nextTick, type VNode } from "vue";

import type { CellRange, DataTableProps } from "../src/adapter";
import type {
  cellNavigation,
  editing,
  grouping,
  rowReorder,
  virtualize,
} from "../src/features";
import type { ColumnDef } from "../src/index";

interface NativeKit {
  name: string;
  render: (props: ScenarioProps) => VNode;
  install?: (app: App) => void;
  cellNavigation: typeof cellNavigation;
  editing: typeof editing;
  grouping: typeof grouping;
  rowReorder: typeof rowReorder;
  virtualize: typeof virtualize;
}

// The scenario sends only behavioral options, not a promise about a kit's
// independently typed styling/provider properties.
type ScenarioProps = Pick<
  DataTableProps<ConformanceRow>,
  | "data"
  | "columns"
  | "rowKey"
  | "tableLabel"
  | "dir"
  | "forceMobile"
  | "urlSync"
  | "selectable"
  | "labels"
  | "defaults"
  | "features"
  | "paginationMode"
>;

interface NativeScenario extends ConformanceScenario {
  onRangeChange?: (range: CellRange | null) => void;
}
interface NativeDriver extends ConformanceDriver {
  mount: (scenario: NativeScenario) => ConformanceMount;
}

export function nativeConformanceDriver(kit: NativeKit): NativeDriver {
  return {
    name: kit.name,
    mount(scenario: NativeScenario) {
      const columns: ColumnDef<ConformanceRow>[] = scenario.columns.map(
        (column) => ({
          key: column.key,
          header: column.header,
          sortable: column.sortable,
          editable: scenario.onCellEdit !== undefined,
          accessor: (row) => row[column.key],
        })
      );
      const { onCellEdit, onRowReorder, groupBy } = scenario;
      const props: ScenarioProps = {
        data: scenario.rows,
        columns,
        rowKey: (row) => row.id,
        tableLabel: scenario.tableLabel,
        dir: scenario.dir,
        forceMobile: scenario.mobile,
        urlSync: false,
        selectable: scenario.selectable,
        labels: scenario.labels,
        defaults:
          scenario.pageSize === undefined
            ? undefined
            : { limit: scenario.pageSize },
        features: [
          ...(scenario.navigable
            ? [kit.cellNavigation({ onRangeChange: scenario.onRangeChange })]
            : []),
          ...(onCellEdit
            ? [
                kit.editing<ConformanceRow>((row, key, value) => {
                  onCellEdit(row.id, key, value);
                }),
              ]
            : []),
          ...(onRowReorder
            ? [
                kit.rowReorder<ConformanceRow>((from, to, row) => {
                  onRowReorder(from, to, row.id);
                }),
              ]
            : []),
          ...(groupBy ? [kit.grouping(groupBy)] : []),
          ...(scenario.virtualize ? [kit.virtualize({ maxHeight: 200 })] : []),
        ],
        ...(scenario.virtualize ? { paginationMode: "infinite" } : {}),
      };
      const container = document.createElement("div");
      document.body.append(container);
      const app = createApp({ render: () => kit.render(props) });
      kit.install?.(app);
      app.mount(container);
      return {
        container,
        ready: nextTick(),
        unmount: () => {
          app.unmount();
          container.remove();
        },
      };
    },
  };
}

/** Native DOM events plus the runner's retry mechanism; no simulated model. */
export const nativeConformanceHarness = {
  fireEvent: {
    click(element: Element) {
      element.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true })
      );
    },
    keyDown(element: Element, init?: KeyboardEventInit) {
      element.dispatchEvent(
        new KeyboardEvent("keydown", {
          ...init,
          bubbles: true,
          cancelable: true,
        })
      );
    },
  },
  waitFor: <T>(callback: () => T): Promise<T> => vi.waitFor(callback),
};

/** Additional rendered range checks over the same real native mount. */
export function nativeRangeConformanceTests(
  driver: NativeDriver
): readonly ConformanceTest[] {
  return [false, true].map((rtl) => ({
    name: `extends, shrinks and collapses a keyboard cell range (${rtl ? "RTL" : "LTR"})`,
    async run() {
      const report = vi.fn<(range: CellRange | null) => void>();
      const view = driver.mount({
        rows: CONFORMANCE_ROWS,
        columns: CONFORMANCE_COLUMNS,
        tableLabel: "People",
        dir: rtl ? "rtl" : "ltr",
        navigable: true,
        onRangeChange: report,
      });
      try {
        await view.ready;
        const grid = view.container.querySelector<HTMLElement>('[role="grid"]');
        if (!grid) throw new Error("Missing native grid");
        const cell = (row: number, col: number) =>
          view.container.querySelector<HTMLElement>(
            `[data-grid-cell="${row}:${col}"]`
          );
        cell(0, 0)?.focus();
        nativeConformanceHarness.fireEvent.keyDown(grid, {
          key: rtl ? "ArrowLeft" : "ArrowRight",
          shiftKey: true,
        });
        await vi.waitFor(() => expect(document.activeElement).toBe(cell(0, 1)));
        nativeConformanceHarness.fireEvent.keyDown(grid, {
          key: "ArrowDown",
          shiftKey: true,
        });
        await vi.waitFor(() => {
          expect(report).toHaveBeenLastCalledWith({
            anchor: { row: 0, col: 0 },
            head: { row: 1, col: 1 },
          });
          expect(document.activeElement).toBe(cell(1, 1));
          expect(
            view.container.querySelectorAll(
              '[data-grid-cell][aria-selected="true"]'
            )
          ).toHaveLength(4);
          expect(
            view.container.querySelector(
              '[data-adapttable-part="grid-announcer"]'
            )?.textContent
          ).toBe(
            defaultLabels.gridRangeSelection({
              fromRow: 1,
              toRow: 2,
              fromColumn: 1,
              toColumn: 2,
              cells: 4,
            })
          );
        });
        nativeConformanceHarness.fireEvent.keyDown(grid, {
          key: "ArrowUp",
          shiftKey: true,
        });
        await vi.waitFor(() => {
          expect(report).toHaveBeenLastCalledWith({
            anchor: { row: 0, col: 0 },
            head: { row: 0, col: 1 },
          });
          expect(
            view.container.querySelectorAll(
              '[data-grid-cell][aria-selected="true"]'
            )
          ).toHaveLength(2);
        });
        // An unmodified move collapses the rectangle to its destination cell.
        nativeConformanceHarness.fireEvent.keyDown(grid, { key: "ArrowDown" });
        await vi.waitFor(() => {
          // Public range callbacks normalize a single focused cell to null.
          expect(report).toHaveBeenLastCalledWith(null);
          expect(document.activeElement).toBe(cell(1, 1));
          expect(
            view.container.querySelectorAll(
              '[data-grid-cell][aria-selected="true"]'
            )
          ).toHaveLength(0);
        });
      } finally {
        view.unmount();
      }
    },
  }));
}
