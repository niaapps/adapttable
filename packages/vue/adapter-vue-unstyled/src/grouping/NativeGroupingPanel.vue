<script setup lang="ts" generic="TRow">
import { type GroupingPanelProps } from "@adapttable/vue";
import { GroupingPanelChrome } from "@adapttable/vue/adapter";

import { useClassNames } from "../classNamesContext";
import { nativeGroupingControls } from "./nativeGroupingControls";

defineOptions({ name: "NativeGroupingPanel" });
const props = defineProps<GroupingPanelProps<TRow>>();
const names = useClassNames();
const controls = nativeGroupingControls(names);
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
.adapttable-vue-unstyled-grouping-layout {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  min-inline-size: 0;
}
.adapttable-vue-unstyled-grouping-layout-label,
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-aggregations"]::before {
  font-size: 0.8125rem;
  font-weight: 600;
  color: currentColor;
  margin-inline-end: 0.5rem;
}
.adapttable-vue-unstyled-grouping-layout [data-adapttable-part="grouping-add"] {
  flex: 0 1 15rem;
  inline-size: 15rem;
  min-inline-size: 0;
  max-inline-size: 100%;
}
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-aggregations"] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  flex-basis: 100%;
  min-inline-size: 0;
  margin: 0.25rem 0 0;
  padding: 0.75rem 0 0;
  border: 0;
  border-block-start: 1px solid
    color-mix(in srgb, currentColor 18%, transparent);
}
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-aggregations"]::before {
  content: attr(aria-label);
}
.adapttable-vue-unstyled-grouping-layout [data-adapttable-aggregation],
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-aggregation-item"] {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  min-inline-size: 0;
  max-inline-size: 100%;
  margin: 0;
}
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-aggregation-operation"] {
  flex: 0 1 8rem;
  inline-size: 8rem;
  min-inline-size: 0;
  max-inline-size: 100%;
}
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-aggregation-add"] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  min-inline-size: 0;
  max-inline-size: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  box-shadow: none;
}
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-aggregation-add"]
  legend {
  float: inline-start;
  padding: 0;
  font-size: 0.8125rem;
  color: currentColor;
}
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-aggregation-add"]
  label {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0;
}
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-chip-remove"],
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-aggregation-remove"] {
  min-inline-size: 2rem;
  min-block-size: 2rem;
}
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-chip"] {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

/* Keep insertion boundaries stable so the target never moves under the pointer. */
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-drop-zone"] {
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
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-drop-zone"][data-empty] {
  min-inline-size: 9rem;
  min-block-size: 44px;
  padding: 0.5rem;
}
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-drop-zone"][data-dragging] {
  opacity: 1;
  border-color: Highlight;
  background: color-mix(in srgb, Highlight 8%, transparent);
}
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-drop-zone"][data-active] {
  border-style: solid;
  border-color: Highlight;
  background: color-mix(in srgb, Highlight 22%, transparent);
  outline: 2px solid Highlight;
  outline-offset: 1px;
}
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-chip-handle"] {
  cursor: grab;
}
.adapttable-vue-unstyled-grouping-layout [data-grouping-dragging] {
  opacity: 0.5;
  cursor: grabbing;
}
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-remove-zone"] {
  display: flex;
  flex: 1 1 100%;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-block-size: 44px;
  padding: 0.5rem 0.75rem;
  border: 1px dashed #b91c1c;
  border-radius: 6px;
  color: #b91c1c;
  font-size: 0.8125rem;
}
.adapttable-vue-unstyled-grouping-layout
  [data-adapttable-part="grouping-remove-zone"][data-active] {
  background: color-mix(in srgb, #b91c1c 12%, transparent);
  border-style: solid;
  outline: 2px solid #b91c1c;
}
</style>
