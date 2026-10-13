import "../entry-navigation-shell";

import { createStandaloneApp } from "../createStandaloneApp";
import ActionControlsDemo from "./ActionControlsDemo.vue";
const root = document.getElementById("root");
if (!root) throw new Error("The Vue action showcase has no #root.");
createStandaloneApp(ActionControlsDemo).mount(root);
