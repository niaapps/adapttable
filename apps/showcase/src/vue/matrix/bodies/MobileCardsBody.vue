<script setup lang="ts">
/** Mobile cards: the same table, every row a card, in a phone-width frame. */
import { ref } from "vue";

import { PEOPLE, peopleColumns, rowKey, TABLE_PRESENTATION } from "../data";
import { useShowcaseKit } from "../showcaseKit";

const kit = useShowcaseKit();
const mobile = ref<boolean | undefined>(true);
const log = ref("Choose a person to see the host callback.");
const features = [
  kit.rowActions([
    {
      key: "profile",
      label: "View profile",
      onClick: (row: (typeof PEOPLE)[number]) => {
        log.value = `Opened ${row.name}`;
      },
    },
  ]),
];
const columns = peopleColumns({
  status: kit.status,
  avatar: kit.avatar,
  progress: kit.progress,
});
</script>

<template>
  <div class="mx-demo">
    <div class="hint-row" role="group" aria-label="Layout">
      <button
        type="button"
        class="seg__btn"
        :aria-pressed="mobile === undefined"
        @click="mobile = undefined"
      >
        Automatic
      </button>
      <button
        type="button"
        class="seg__btn"
        :aria-pressed="mobile === true"
        @click="mobile = true"
      >
        Phone cards
      </button>
      <button
        type="button"
        class="seg__btn"
        :aria-pressed="mobile === false"
        @click="mobile = false"
      >
        Scrollable table
      </button>
    </div>
    <div class="mx-demo__body" :class="{ 'mx-phone': mobile === true }">
      <component
        :is="kit.DataTable"
        v-bind="TABLE_PRESENTATION"
        table-label="People"
        :url-sync="false"
        :force-mobile="mobile"
        selectable
        :features="features"
        :data="PEOPLE"
        :columns="columns"
        :row-key="rowKey"
        :defaults="{ limit: 8 }"
      />
    </div>
    <p class="hint" role="status" data-demo-log>{{ log }}</p>
  </div>
</template>
