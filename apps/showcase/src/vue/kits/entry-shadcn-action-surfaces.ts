import "../entry-navigation-shell";
import "@adapttable/shadcn-vue/styles.css";
import "./shadcn-theme.css";

import Fixture from "../../../../../packages/vue/adapter-shadcn-vue/test/browser/action-surfaces.fixture";
import { createStandaloneApp } from "../createStandaloneApp";

createStandaloneApp(Fixture).mount("#root");
