<script setup lang="ts" generic="TRow">
import type { RowActionControl } from "@adapttable/vue";
import {
  type DataTableClassNames,
  mergeVueAttrs,
  type RowActionsLayout,
} from "@adapttable/vue/adapter";
import { QMenu } from "quasar";
import { ref, watch } from "vue";

import QuasarButton from "../controls/QuasarButton.vue";

defineOptions({ inheritAttrs: false });
const props = defineProps<{
  controls: readonly RowActionControl<TRow>[];
  layout?: RowActionsLayout;
  label: string;
  classNames: DataTableClassNames;
}>();
const open = ref(false);
const menu = ref<InstanceType<typeof QMenu> | null>(null);
const updatePosition = () => menu.value?.updatePosition();
watch(
  open,
  (expanded, _previous, cleanup) => {
    if (!expanded) return;
    const element: unknown = menu.value?.$el;
    const view =
      typeof Node !== "undefined" && element instanceof Node
        ? element.ownerDocument?.defaultView
        : null;
    if (!view) return;
    view.addEventListener("scroll", updatePosition, true);
    view.addEventListener("resize", updatePosition);
    cleanup(() => {
      view.removeEventListener("scroll", updatePosition, true);
      view.removeEventListener("resize", updatePosition);
    });
  },
  { flush: "post" }
);
function actionAttrs(action: RowActionControl<TRow>) {
  return mergeVueAttrs(action.attrs, {
    class: [props.classNames.actionButton, props.classNames.rowAction],
    onClick: (event: MouseEvent) => {
      event.stopPropagation();
      if (!action.attrs.disabled) open.value = false;
    },
  });
}
</script>

<template>
  <QuasarButton
    v-if="layout === 'menu' && controls.length"
    :attrs="{
      'data-adapttable-part': 'row-actions-trigger',
      'aria-label': label,
      'aria-expanded': open,
      class: classNames.rowActionsTrigger,
      onClick: (event: MouseEvent) => event.stopPropagation(),
    }"
  >
    <span aria-hidden="true">⋮</span>
    <QMenu
      ref="menu"
      v-model="open"
      :class="classNames.rowActionsMenu"
      data-adapttable-part="row-actions-menu"
      @show="updatePosition"
    >
      <div class="adapttable-quasar-row-actions-menu">
        <QuasarButton
          v-for="action in controls"
          :key="action.key"
          :attrs="actionAttrs(action)"
          :label="action.label"
        />
      </div>
    </QMenu>
  </QuasarButton>
  <template v-else>
    <QuasarButton
      v-for="action in controls"
      :key="action.key"
      :attrs="actionAttrs(action)"
      :label="action.label"
    />
  </template>
</template>
