import { createMemoryAdapter, useFrontendData } from "@adapttable/react";
import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataTable } from "./DataTable";
import { renderBaseUi } from "./test-utils";

const rows = [
  { id: "1", name: "Ada" },
  { id: "2", name: "Grace" },
];
const columns = [{ key: "name", header: "Person", sortable: true }];

describe("native mobile sort direction", () => {
  it.each(["ltr", "rtl"] as const)(
    "reverses real row order and preserves URL state in %s",
    (dir) => {
      const adapter = createMemoryAdapter("sortBy=name&sortDir=asc");
      function Host() {
        const source = useFrontendData({
          data: rows,
          columns,
          urlAdapter: adapter,
        });
        return (
          <DataTable
            source={source}
            columns={columns}
            rowKey={(row) => row.id}
            forceMobile
            dir={dir}
          />
        );
      }
      const { container } = renderBaseUi(<Host />);
      const cards = () => [
        ...container.querySelectorAll('[data-adapttable-part="card"]'),
      ];
      expect(cards()[0]?.textContent).toContain("Ada");
      fireEvent.click(screen.getByRole("button", { name: "Sort descending" }));
      expect(cards()[0]?.textContent).toContain("Grace");
      expect(adapter.getSearch()).toContain("sortDir=desc");
      fireEvent.click(screen.getByRole("button", { name: "Sort ascending" }));
      expect(cards()[0]?.textContent).toContain("Ada");
      expect(adapter.getSearch()).toContain("sortDir=asc");
      act(() => adapter.setSearch("sortBy=name&sortDir=desc"));
      expect(cards()[0]?.textContent).toContain("Grace");
      act(() => adapter.setSearch(""));
      expect(
        screen.getByRole("button", { name: "Sort descending" })
      ).toBeDisabled();
    }
  );
});
