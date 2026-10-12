import "./entry-navigation-shell";

import Demo from "../../../../packages/vue/adapter-vue-unstyled/browser/selection/SelectionContractDemo.vue";
import { createStandaloneApp } from "./createStandaloneApp";

createStandaloneApp(Demo).mount("#root");
