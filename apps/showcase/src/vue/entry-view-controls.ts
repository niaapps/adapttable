import "./entry-navigation-shell";

import Demo from "../../../../packages/vue/adapter-vue-unstyled/browser/view-controls/ViewControlsDemo.vue";
import { createStandaloneApp } from "./createStandaloneApp";

createStandaloneApp(Demo).mount("#root");
