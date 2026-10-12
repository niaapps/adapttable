import "../entry-navigation-shell";

import { createStandaloneApp } from "../createStandaloneApp";
import ColumnMenuDemo from "./ColumnMenuDemo.vue";
const root = document.getElementById("root");
if (!root) throw new Error("The Vue showcase page has no #root to mount into.");
document.documentElement.dataset.framework = "vue";
createStandaloneApp(ColumnMenuDemo).mount(root);
