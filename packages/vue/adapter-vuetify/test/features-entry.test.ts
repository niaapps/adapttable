import { describe, expect, it } from "vitest";

import { columnMenu } from "../src/column-menu";
import { densityChooser } from "../src/density";
import { editing } from "../src/editing";
import { exportCsv } from "../src/export";
import * as combined from "../src/features";
import { filters } from "../src/filters";
import * as base from "../src/index";
import { rowActions } from "../src/row-actions";
import { savedViews } from "../src/saved-views";

// Public aliases must retain the native factory, rather than a binding-only fill.
describe("combined native feature entry", () => {
  it("retains canonical factory identity across individual imports", () => {
    expect(combined.columnMenu).toBe(columnMenu);
    expect(combined.densityChooser).toBe(densityChooser);
    expect(combined.editing).toBe(editing);
    expect(combined.exportCsv).toBe(exportCsv);
    expect(combined.filters).toBe(filters);
    expect(combined.rowActions).toBe(rowActions);
    expect(combined.savedViews).toBe(savedViews);
  });
  it("leaves optional composition absent from the base entry", () => {
    expect(base).not.toHaveProperty("filters");
    expect(base).not.toHaveProperty("editing");
    expect(base).not.toHaveProperty("savedViews");
    expect(base).toHaveProperty("DataTable");
  });
});
