<script setup lang="ts">
import UInput from "@nuxt/ui/components/Input.vue";
import { computed } from "vue";

import type { ShowcaseInputProps } from "../showcaseKit";

const props = defineProps<ShowcaseInputProps>();
const attributes = computed(() => ({
  "aria-label": props.label,
  "data-adapttable-part": props.part,
}));
</script>

<template>
  <UInput
    v-bind="attributes"
    :model-value="value"
    :type="type"
    :disabled="disabled"
    autocomplete="off"
    class="w-full"
    @update:model-value="onChange(String($event ?? ''))"
  />
</template>
