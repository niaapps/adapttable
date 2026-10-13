import "./entry-navigation-shell";
import "@adapttable/vue-unstyled/styles.css";

import { CompositionDemo } from "../../../../packages/vue/adapter-vue-unstyled/browser/composition/main";
import { createStandaloneApp } from "./createStandaloneApp";

createStandaloneApp(CompositionDemo).mount("#root");
