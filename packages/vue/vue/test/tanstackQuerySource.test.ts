import type { PaginatedResponse, TableQueryParams } from "@adapttable/core";
import {
  QueryClient,
  useInfiniteQuery,
  VueQueryPlugin,
} from "@tanstack/vue-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { computed, createApp, h, type ShallowRef } from "vue";

import { DataTable } from "../../adapter-vue-unstyled/src";
import { deferred } from "../../adapter-vue-unstyled/test/filter-editing-helpers";
import { type ColumnDef, type QuerySourceState, useQuerySource } from "../src";

interface Row {
  id: string;
  name: string;
}
type Page = PaginatedResponse<Row>;
interface Request {
  params: Partial<TableQueryParams>;
  signal: AbortSignal;
  answer: ReturnType<typeof deferred<Page>>;
}
const people: Row[] = [
  { id: "ada", name: "Ada" },
  { id: "grace", name: "Grace" },
  { id: "linus", name: "Linus" },
  { id: "bea", name: "Bea" },
];
const columns: ColumnDef<Row>[] = [
  { key: "name", header: "Name", sortable: true },
];
const dispose: (() => void)[] = [];
afterEach(() => {
  for (const stop of dispose.splice(0)) stop();
});

function mountQueryTable(mode: "paged" | "infinite" = "paged") {
  const requests: Request[] = [];
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const container = document.createElement("div");
  document.body.append(container);
  let source: QuerySourceState<Row> | undefined;
  let liveParams: Readonly<ShallowRef<Partial<TableQueryParams>>> | undefined;
  let factoryCalls = 0;
  const app = createApp({
    setup() {
      source = useQuerySource<Row>({
        urlSync: false,
        forceMobile: false,
        paginationMode: mode,
        defaults: { limit: 2 },
        query(params) {
          factoryCalls++;
          liveParams = params;
          return useInfiniteQuery({
            queryKey: computed(() => ["people", params.value] as const),
            initialPageParam: 1,
            queryFn: ({ queryKey, pageParam, signal }) => {
              const request: Request = {
                params: {
                  ...queryKey[1],
                  page: mode === "paged" ? queryKey[1].page : pageParam,
                },
                signal,
                answer: deferred<Page>(),
              };
              requests.push(request);
              return request.answer.promise;
            },
            getNextPageParam: (page) =>
              page.page * page.limit < page.total ? page.page + 1 : undefined,
          });
        },
      });
      const active = source;
      return () =>
        h(DataTable<Row>, {
          source: active.value,
          columns,
          rowKey: (row) => row.id,
          forceMobile: false,
          searchable: false,
          urlSync: false,
        });
    },
  });
  app.use(VueQueryPlugin, { queryClient: client });
  app.mount(container);
  if (!source || !liveParams) throw new Error("Query source did not mount");
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    app.unmount();
    container.remove();
  };
  dispose.push(() => {
    stop();
    client.clear();
  });
  const rowIds = () =>
    Array.from(container.querySelectorAll("tbody [data-row-id]")).map((row) =>
      row.getAttribute("data-row-id")
    );
  const answer = (request: Request) => {
    const { params } = request;
    let rows = people.filter(
      (row) =>
        !params.search ||
        row.name.toLowerCase().includes(params.search.toLowerCase())
    );
    if (params.filters?.name)
      rows = rows.filter((row) => row.name === params.filters?.name);
    if (params.sortBy === "name")
      rows.sort(
        (a, b) =>
          a.name.localeCompare(b.name) * (params.sortDir === "desc" ? -1 : 1)
      );
    const page = params.page ?? 1,
      limit = params.limit ?? 2;
    request.answer.resolve({
      rows: rows.slice((page - 1) * limit, page * limit),
      total: rows.length,
      page,
      limit,
    });
  };
  return {
    source,
    params: liveParams,
    requests,
    client,
    container,
    rowIds,
    answer,
    stop,
    factoryCalls: () => factoryCalls,
  };
}

async function requestAt(
  view: ReturnType<typeof mountQueryTable>,
  index: number
) {
  await vi.waitFor(() => expect(view.requests.length).toBeGreaterThan(index));
  const request = view.requests[index];
  if (!request) throw new Error(`Missing request ${index}`);
  return request;
}

describe("actual TanStack Vue Query table source", () => {
  it("renders paging, sorting and filtering from reactive query keys", async () => {
    const view = mountQueryTable();
    const first = await requestAt(view, 0);
    expect(first.params).toMatchObject({ page: 1, limit: 2 });
    expect(view.source.value.isLoading).toBe(true);
    expect(
      view.container.querySelector('[data-adapttable-part="loading"]')
    ).not.toBeNull();
    view.answer(first);
    await vi.waitFor(() => expect(view.rowIds()).toEqual(["ada", "grace"]));
    view.source.value.setPage(2);
    const second = await requestAt(view, 1);
    expect(second.params.page).toBe(2);
    view.answer(second);
    await vi.waitFor(() => expect(view.rowIds()).toEqual(["linus", "bea"]));
    view.source.value.setSort("name", "desc");
    const sorted = await requestAt(view, 2);
    expect(sorted.params).toMatchObject({
      page: 1,
      sortBy: "name",
      sortDir: "desc",
    });
    view.answer(sorted);
    await vi.waitFor(() => expect(view.rowIds()).toEqual(["linus", "grace"]));
    view.source.value.setSearch("Ada");
    const filtered = await requestAt(view, 3);
    expect(filtered.params.search).toBe("Ada");
    view.answer(filtered);
    await vi.waitFor(() => expect(view.rowIds()).toEqual(["ada"]));
    expect(view.source.value.total).toBe(1);
    view.source.value.setSearch("");
    view.source.value.setExtra("name", "Bea");
    const columnFiltered = await requestAt(view, 4);
    expect(columnFiltered.params.filters).toEqual({ name: "Bea" });
    view.answer(columnFiltered);
    await vi.waitFor(() => expect(view.rowIds()).toEqual(["bea"]));
    expect(view.client.getQueryCache().findAll()).toHaveLength(5);
    expect(view.factoryCalls()).toBe(1);
  });

  it("exposes actual query failures and refetches successfully", async () => {
    const view = mountQueryTable();
    const first = await requestAt(view, 0);
    first.answer.reject(new Error("Local endpoint unavailable"));
    await vi.waitFor(() =>
      expect(view.source.value.error?.message).toBe(
        "Local endpoint unavailable"
      )
    );
    expect(view.source.value.isLoading).toBe(false);
    expect(view.rowIds()).toEqual([]);
    const retry = view.source.value.refetch?.();
    const next = await requestAt(view, 1);
    expect(view.source.value.isFetching).toBe(true);
    view.answer(next);
    await retry;
    await vi.waitFor(() => expect(view.rowIds()).toEqual(["ada", "grace"]));
    expect(view.source.value.error).toBeNull();
  });

  it("ignores a late response for an abandoned filter and cancels on unmount", async () => {
    const view = mountQueryTable();
    const stale = await requestAt(view, 0);
    view.source.value.setSearch("Grace");
    const current = await requestAt(view, 1);
    expect(stale.signal.aborted).toBe(true);
    view.answer(current);
    await vi.waitFor(() => expect(view.rowIds()).toEqual(["grace"]));
    view.answer(stale);
    await vi.waitFor(() => expect(view.source.value.isFetching).toBe(false));
    expect(view.rowIds()).toEqual(["grace"]);
    view.source.value.setSearch("Linus");
    const pending = await requestAt(view, 2);
    const refetch = view.source.value.refetch,
      more = view.source.value.fetchNextPage;
    view.stop();
    expect(pending.signal.aborted).toBe(true);
    refetch?.();
    more();
    expect(view.requests).toHaveLength(3);
    view.answer(pending);
    expect(view.container.isConnected).toBe(false);
  });

  it("appends real infinite pages while guarding duplicate fetches", async () => {
    const view = mountQueryTable("infinite");
    const first = await requestAt(view, 0);
    view.answer(first);
    await vi.waitFor(() => expect(view.rowIds()).toEqual(["ada", "grace"]));
    expect(view.source.value.hasNextPage).toBe(true);
    view.source.value.fetchNextPage();
    const second = await requestAt(view, 1);
    expect(second.params.page).toBe(2);
    expect(view.source.value.isFetchingNextPage).toBe(true);
    view.source.value.fetchNextPage();
    expect(view.requests).toHaveLength(2);
    view.answer(second);
    await vi.waitFor(() =>
      expect(view.rowIds()).toEqual(["ada", "grace", "linus", "bea"])
    );
    expect(view.source.value.hasNextPage).toBe(false);
  });
});
