import "../../styles.css";
import "../../angular/matrixPage.css";
import "../matrix/matrixPage.css";
import "./demo.css";

import { createApp, h } from "vue";

import { adaptersOf } from "../../matrix/content";
import { SHOWCASE_PRESENTATION } from "../matrix/data";
import { loadVueShowcaseKit } from "../matrix/loadKit";
import { SHOWCASE_KIT } from "../matrix/showcaseKit";
import DemoPage from "./DemoPage.vue";

document.documentElement.dataset.framework = "vue";
const root = document.getElementById("root");
if (!root) throw new Error("The Vue demo has no root");
const adapters = adaptersOf("vue").filter((adapter) => adapter.built);
const requested = new URLSearchParams(window.location.search).get("kit");
const adapter =
  adapters.find((candidate) => candidate.key === requested) ?? adapters[0];
const { kit } = await loadVueShowcaseKit(adapter.key);
const app = createApp({
  render: () => h(DemoPage, { adapter, lab: root.dataset.vueMode === "lab" }),
});
app.provide(SHOWCASE_KIT, kit);
let dark = false;
try {
  dark = localStorage.getItem("adapttable-demo-theme") === "dark";
} catch {
  // Appearance storage is optional.
}
kit.install?.(app, { dark, ...SHOWCASE_PRESENTATION });
root.replaceChildren();
app.mount(root);
