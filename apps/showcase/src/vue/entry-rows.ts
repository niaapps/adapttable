import "./entry-navigation-shell";

import Demo from "../../../../packages/vue/adapter-vue-unstyled/browser/rows/RowsDemo.vue";
import { createStandaloneApp } from "./createStandaloneApp";

createStandaloneApp(Demo).mount("#root");
