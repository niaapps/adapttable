<script setup lang="ts" generic="TRow">
import { type GroupingPanelProps } from "@adapttable/vue";
import { GroupingPanelChrome } from "@adapttable/vue/adapter";

import { useClassNames } from "../classNamesContext";
import { elementGroupingControls } from "./elementGroupingControls";

defineOptions({ name: "ElementGroupingPanel" });
const props = defineProps<GroupingPanelProps<TRow>>();
const names = useClassNames();
const controls = elementGroupingControls(names);
const Render = () =>
  GroupingPanelChrome({
    ...props,
    classNames: names.value,
    slots: controls,
  });

// Declare no props so Vue forwards all root attributes, including id and data-*.
const renderProps: string[] = [];
Render.props = renderProps;
</script>

<template>
  <Render />
</template>

<style>
.adapttable-element-grouping > .el-card__body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}
.adapttable-element-grouping-label,
.adapttable-element-grouping
  [data-adapttable-part="grouping-aggregations"]::before {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-inline-end: 0.5rem;
}
.adapttable-element-grouping [data-adapttable-part="grouping-add"] {
  inline-size: 15rem;
  max-inline-size: 100%;
}
.adapttable-element-grouping [data-adapttable-part="grouping-chip"] {
  block-size: auto;
  padding: 0.125rem 0.25rem;
}
.adapttable-element-grouping
  [data-adapttable-part="grouping-chip"]
  .el-tag__content {
  display: inline-flex;
  align-items: center;
}
.adapttable-element-grouping [data-adapttable-part="grouping-aggregations"] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  flex-basis: 100%;
  min-inline-size: 0;
  margin: 0.25rem 0 0;
  padding: 0.75rem 0 0;
  border: 0;
  border-block-start: 1px solid var(--el-border-color-lighter);
}
.adapttable-element-grouping
  [data-adapttable-part="grouping-aggregations"]::before {
  content: attr(aria-label);
}
.adapttable-element-grouping [data-adapttable-aggregation],
.adapttable-element-grouping
  [data-adapttable-part="grouping-aggregation-item"] {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  min-inline-size: 0;
  max-inline-size: 100%;
}
.adapttable-element-grouping
  [data-adapttable-part="grouping-aggregation-operation"] {
  inline-size: 8rem;
  max-inline-size: 100%;
}
.adapttable-element-grouping [data-adapttable-part="grouping-aggregation-add"] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.adapttable-element-grouping
  [data-adapttable-part="grouping-aggregation-add"]
  legend {
  float: inline-start;
  padding: 0;
  font-size: 0.8125rem;
  color: var(--el-text-color-secondary);
}
.adapttable-element-grouping
  [data-adapttable-part="grouping-aggregation-add"]
  .el-checkbox {
  margin: 0;
}
.adapttable-element-grouping [data-adapttable-part="grouping-chip-remove"],
.adapttable-element-grouping
  [data-adapttable-part="grouping-aggregation-remove"] {
  margin: 0;
  min-inline-size: 1.75rem;
  padding-inline: 0.375rem;
}

/* Keep insertion boundaries stable so the target never moves under the pointer. */
.adapttable-element-grouping [data-adapttable-part="grouping-drop-zone"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex: 0 0 auto;
  min-inline-size: 10px;
  min-block-size: 32px;
  block-size: auto;
  margin-inline: 2px;
  padding: 0;
  border: 1px dashed color-mix(in srgb, currentColor 30%, transparent);
  border-radius: 4px;
}
.adapttable-element-grouping
  [data-adapttable-part="grouping-drop-zone"][data-empty] {
  min-inline-size: 9rem;
  min-block-size: 44px;
  padding: 0.5rem;
}
.adapttable-element-grouping
  [data-adapttable-part="grouping-drop-zone"][data-dragging] {
  opacity: 1;
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}
.adapttable-element-grouping
  [data-adapttable-part="grouping-drop-zone"][data-active] {
  border-style: solid;
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 22%, transparent);
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}
.adapttable-element-grouping [data-adapttable-part="grouping-chip-handle"] {
  cursor: grab;
}
.adapttable-element-grouping [data-grouping-dragging] {
  opacity: 0.5;
  cursor: grabbing;
}
.adapttable-element-grouping [data-adapttable-part="grouping-remove-zone"] {
  display: flex;
  flex: 1 1 100%;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-block-size: 44px;
  padding: 0.5rem 0.75rem;
  border: 1px dashed var(--el-color-danger);
  border-radius: 6px;
  color: var(--el-color-danger);
  font-size: 0.8125rem;
}
.adapttable-element-grouping
  [data-adapttable-part="grouping-remove-zone"][data-active] {
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
  border-style: solid;
  outline: 2px solid var(--el-color-danger);
}
</style>
