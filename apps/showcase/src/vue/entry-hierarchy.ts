import "./entry-navigation-shell";

import Demo from "../../../../packages/vue/adapter-vue-unstyled/browser/hierarchy/HierarchyDemo.vue";
import { createStandaloneApp } from "./createStandaloneApp";

createStandaloneApp(Demo).mount("#root");
