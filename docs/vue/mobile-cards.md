# Responsive Vue tables and mobile cards

Render responsive Vue table cards with native controls, shared columns, editing, selection and RTL across eight adapters.

Cards are automatic below `mobileBreakpoint` (768px by default). Omit
`forceMobile` to follow the viewport, set it to `true` to always show cards, or
set it to `false` to keep a horizontally scrolling table on phones. Columns,
selection and query state remain shared across both layouts.

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import type { ColumnDef } from "@adapttable/vue";
import { DataTable } from "@adapttable/vue-unstyled";

interface Person {
  id: string;
  name: string;
  score: number;
}
const rows = shallowRef<readonly Person[]>([
  { id: "ada", name: "Ada", score: 10 },
  { id: "grace", name: "Grace", score: 20 },
]);
const columns: ColumnDef<Person>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "score", header: "Score", sortable: true },
];
const rowKey = (row: Person) => row.id;
</script>

<template>
  <DataTable
    :data="rows"
    :columns="columns"
    :row-key="rowKey"
    table-label="People"
    url-key="people"
    :mobile-breakpoint="768"
    locale="ar"
    dir="rtl"
  />
</template>
```

Each adapter owns its card presentation and native controls. The built-in field
body adapts to the card's width, with labels above values and unlabeled fields
spanning the full width. Set `mobileLabel: ""` on a self-explanatory identity
column. A column renderer can supply the kit's avatar, status badge or progress
indicator; cards preserve that renderer instead of converting it to plain text.
Long values wrap, and narrow containers reduce the number of field columns.

Sorting, filtering, selection, row actions and composed editing continue to use
the same models. With `paginationMode="auto"`, cards use infinite loading and
the desktop table uses pages. Set the pagination mode explicitly to keep it
independent of presentation.

## Keep horizontal scrolling on phones

```vue
<DataTable
  :data="rows"
  :columns="columns"
  :row-key="rowKey"
  :force-mobile="false"
  pagination-mode="paged"
  table-label="People"
/>
```

Wide columns scroll inside the table. This presentation suits comparisons
across rows; cards suit reading and acting on individual records. The mobile
demo offers Automatic, Phone cards and Scrollable table choices without
remounting the table. Its initial forced-card preview does not change the
library's automatic default.

Use `locale` for translated labels and `dir` for reading direction; changing direction alone does not translate text. `classNames` exposes semantic card parts in the Unstyled adapter, where the host supplies appearance. Follow the chosen kit’s provider and stylesheet setup for styled adapters. See [getting started](./getting-started.md#choose-a-ui-kit) and [editing](./cell-editing.md).

## Try the native adapters

Use the [live demo](/vue/demo/) or [Feature Lab](/vue/demo/all-options/) to switch all eight Vue kits. Dedicated kit examples show the same feature with each UI kit’s controls.
