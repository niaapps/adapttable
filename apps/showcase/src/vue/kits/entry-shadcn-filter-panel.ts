import "../entry-navigation-shell";
import "@adapttable/shadcn-vue/styles.css";
import "./shadcn-theme.css";

import Fixture from "../../../../../packages/vue/adapter-shadcn-vue/test/browser/filter-panel.fixture";
import { createStandaloneApp } from "../createStandaloneApp";

createStandaloneApp(Fixture).mount("#root");
