import type { Kit, KitInfo } from "./detect";
import type { ScaffoldFile } from "./scaffold";

/** Native Vue SFC; all state stays in the host's data and feature declarations. */
export function vueStarterComponent(info: KitInfo): string {
  const roots: Partial<Record<Kit, { name: string; import: string }>> = {
    vuetify: {
      name: "VApp",
      import: 'import { VApp } from "vuetify/components/VApp";\n',
    },
    "nuxt-ui": {
      name: "UApp",
      import: 'import UApp from "@nuxt/ui/components/App.vue";\n',
    },
  };
  const root = roots[info.kit]?.name;
  const rootImport = roots[info.kit]?.import ?? "";
  return `<script setup lang="ts">
import { DataTable } from "${info.adapter}";
import { filters } from "${info.adapter}/filters";
import type { ColumnDef } from "@adapttable/vue";
${rootImport}
interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
}

const people: Person[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com", role: "Engineer" },
  { id: "2", name: "Alan Turing", email: "alan@example.com", role: "Founder" },
  { id: "3", name: "Grace Hopper", email: "grace@example.com", role: "Admiral" },
];
const columns: ColumnDef<Person>[] = [
  { key: "name", header: "Name", accessor: (row) => row.name, sortable: true },
  { key: "email", header: "Email", accessor: (row) => row.email },
  { key: "role", header: "Role", accessor: (row) => row.role, sortable: true },
];
const rowKey = (row: Person) => row.id;
const features = [filters<Person>([{ key: "name", type: "text", label: "Name" }])];
</script>

<template>
${root ? `  <${root} class="isolate">\n` : ""}  <DataTable :data="people" :columns="columns" :row-key="rowKey" :features="features" />
${root ? `  </${root}>\n` : ""}</template>
`;
}

/** Host-owned registration and global kit styles; existing host files are untouched. */
function vueSetup(info: KitInfo): string {
  const setup: Partial<
    Record<Kit, { style: string; imports: string; install: string }>
  > = {
    "element-plus": {
      style: 'import "element-plus/dist/index.css";\n',
      imports: "",
      install: "  void app;",
    },
    vuetify: {
      style: 'import "vuetify/styles";\n',
      imports:
        'import { createVuetify } from "vuetify/framework";\nimport { aliases, mdi } from "vuetify/iconsets/mdi-svg";\n',
      install:
        '  app.use(createVuetify({ icons: { defaultSet: "mdi", aliases, sets: { mdi } } }));',
    },
    quasar: {
      style: 'import "quasar/dist/quasar.css";\n',
      imports: 'import { Quasar } from "quasar";\n',
      install: "  app.use(Quasar, { config: {} });",
    },
    "nuxt-ui": {
      style: 'import "./adapttable.css";\n',
      imports: 'import ui from "@nuxt/ui/vue-plugin";\n',
      install: "  app.use(ui);",
    },
  };
  const sdkStyles = setup[info.kit]?.style ?? "";
  const styles =
    info.kit === "vue-unstyled" || info.kit === "nuxt-ui"
      ? ""
      : `import "${info.adapter}/styles.css";\n`;
  const plugin = setup[info.kit]?.imports ?? "";
  const install =
    setup[info.kit]?.install ??
    "  // This kit needs no application plugin. Keep host theme/locale providers as needed.\n  void app;";
  return `${sdkStyles}${styles}${plugin}import type { App } from "vue";

/** Call once on your app, before mounting the generated PeopleTable. */
export function installAdaptTable(app: App): void {
${install}
}
`;
}

/** Plain Vue/Vite setup, including the official build plugin where required. */
export function vueScaffoldFiles(info: KitInfo): ScaffoldFile[] {
  const files = [
    { path: "src/PeopleTable.vue", contents: vueStarterComponent(info) },
    { path: "src/adapttable.ts", contents: vueSetup(info) },
  ];
  if (info.kit === "nuxt-ui") {
    files.push(
      {
        path: "src/adapttable.css",
        contents:
          '@import "tailwindcss";\n@import "@nuxt/ui";\n@import "@adapttable/nuxt-ui/styles.css";\n',
      },
      {
        path: "adapttable.vite.ts",
        contents:
          'import ui from "@nuxt/ui/vite";\nimport vue from "@vitejs/plugin-vue";\n\n// Router-less starter. Enable router integration if your host uses Vue Router.\nexport const adaptTableViteConfig = { plugins: [vue(), ui({ router: false, prose: true })], resolve: { dedupe: ["vue", "@nuxt/ui"] } };\n',
      }
    );
  }
  if (info.kit === "quasar") {
    files.push({
      path: "adapttable.vite.ts",
      contents:
        'import { quasar, transformAssetUrls } from "@quasar/vite-plugin";\nimport vue from "@vitejs/plugin-vue";\n\nexport const adaptTableViteConfig = { plugins: [vue({ template: { transformAssetUrls } }), quasar()], resolve: { dedupe: ["vue"] } };\n',
    });
  }
  return files;
}
