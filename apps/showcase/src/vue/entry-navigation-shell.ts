import "../styles.css";

import { createApp, h } from "vue";

import { adaptersOf } from "../matrix/content";
import ShowcaseNav from "./matrix/ShowcaseNav.vue";
import { useWorkspacePresentation } from "./workspace/presentation";

// Standalone examples use the same navigation as live, lab and matrix pages.
const root = document.getElementById("showcase-navigation");
if (!root) throw new Error("The standalone example has no navigation root.");
const kit = adaptersOf("vue").find(
  (adapter) => adapter.key === root.dataset.kit
);
if (!kit) throw new Error("The standalone example has no registered kit.");
const active = root.dataset.page ?? "";
document.documentElement.dataset.framework = "vue";
createApp({
  setup() {
    const presentation = useWorkspacePresentation();
    return () =>
      h(ShowcaseNav, {
        kit,
        active,
        dark: presentation.state.value.dark,
        onToggleDark: () =>
          presentation.navigate({ dark: !presentation.state.value.dark }),
      });
  },
}).mount(root);
