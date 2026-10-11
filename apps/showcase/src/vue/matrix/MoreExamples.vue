<script setup lang="ts">
import {
  VUE_KIT_LAB_PAGES,
  VUE_KIT_PAGES,
  VUE_NATIVE_PAGES,
} from "../../../matrix.mjs";
import { vueHref } from "./routes";

const props = defineProps<{ kitKey: string }>();
const examples = [
  ...(props.kitKey === "vue-unstyled" ? VUE_NATIVE_PAGES : []),
  ...VUE_KIT_PAGES.filter((page) => page.kit === props.kitKey),
  ...VUE_KIT_LAB_PAGES.filter((page) =>
    page.path.startsWith(props.kitKey + "/")
  ),
];
</script>

<template>
  <section v-if="examples.length" class="mx-section">
    <h2 class="mx-h2">Workspaces and composed examples</h2>
    <p class="mx-section__lead">
      Explore connected views and additional feature combinations. Each example
      uses fictional data and host-owned updates.
    </p>
    <nav class="mx-rail" aria-label="Vue composed examples">
      <a
        v-for="example in examples"
        :key="example.path"
        :href="vueHref(example.path)"
        >{{ example.title.replace(/ — AdaptTable$/, "") }}</a
      >
    </nav>
  </section>
</template>
