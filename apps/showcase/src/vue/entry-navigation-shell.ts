import "../styles.css";
import "../matrix.css";
import "../angular/matrixPage.css";
import "../assistantShowcase.css";
import "./matrix/matrixPage.css";

import { createApp, h } from "vue";

import { adaptersOf } from "../matrix/content";
import ShowcaseNav from "./matrix/ShowcaseNav.vue";
import { useWorkspacePresentation } from "./workspace/presentation";

// Standalone examples use the same navigation as live, lab and matrix pages.
// Minimal entry hosts mount just the example; generated pages add navigation.
const root = document.getElementById("showcase-navigation");
if (root) {
  const kit = adaptersOf("vue").find(
    (adapter) => adapter.key === root.dataset.kit
  );
  if (!kit) throw new Error("The standalone example has no registered kit.");
  const active = root.dataset.page ?? "";
  if (
    [
      "shadcn-vue/filter-panel",
      "shadcn-vue/feature-parity",
      "shadcn-vue/action-surfaces",
      "naive-ui/filter-panel",
    ].includes(active)
  ) {
    document
      .getElementById("root")
      ?.classList.add("shell", "vue-standalone-lab");
  }
  // Authored pages own their complete layout, theme and overlay styles.
  if (
    kit.key === "vue-unstyled" &&
    !["unstyled/workspace", "unstyled/preview"].includes(active)
  ) {
    document
      .getElementById("root")
      ?.classList.add(
        "mx",
        "mx-ng",
        "mx-ng--unstyled",
        "shell",
        "vue-native-page"
      );
  }
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
}
