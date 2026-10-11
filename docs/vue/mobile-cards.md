# Responsive Vue tables and mobile cards

Render responsive Vue table cards with native controls, shared columns, editing, selection and RTL across eight adapters.

The native table can render responsive cards below `mobileBreakpoint`. `forceMobile` requests cards explicitly. Columns and query state remain shared across the desktop and card layouts.

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
    :force-mobile="true"
    locale="ar"
    dir="rtl"
  />
</template>
```

Each adapter owns its card presentation and native controls. Sorting, filtering, selection, row actions and composed editing continue to use the same models. Mobile cards use infinite loading instead of desktop pagination.

Use `locale` for translated labels and `dir` for reading direction; changing direction alone does not translate text. `classNames` exposes semantic card parts in the Unstyled adapter, where the host supplies appearance. Follow the chosen kit’s provider and stylesheet setup for styled adapters. See [getting started](./getting-started.md#choose-a-ui-kit) and [editing](./cell-editing.md).

## Try the native adapters

Use the [live demo](/vue/demo/) or [Feature Lab](/vue/demo/all-options/) to switch all eight Vue kits. Dedicated kit examples show the same feature with each UI kit’s controls.
