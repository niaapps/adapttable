import "./entry-navigation-shell";
import "@adapttable/vue-unstyled/styles.css";

import { FilterEditingDemo } from "../../../../packages/vue/adapter-vue-unstyled/browser/filter-editing/main";
import { createStandaloneApp } from "./createStandaloneApp";

createStandaloneApp(FilterEditingDemo).mount("#root");
