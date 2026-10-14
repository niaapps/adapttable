import { describe, expect, it } from "vitest";

import { detectFramework, detectKit, KITS } from "./detect";
import { InitError, type InitIO, runInit } from "./init";
import { packagesFor, scaffoldFiles, starterComponent } from "./scaffold";

const vueKits = KITS.filter((kit) => kit.framework === "vue");

function host(
  dependencies: Record<string, string>,
  files: Record<string, string> = {}
) {
  const written: Record<string, string> = {
    "package.json": JSON.stringify({ dependencies }),
    ...files,
  };
  const logs: string[] = [];
  const io: InitIO = {
    readFile: (path) => written[path],
    exists: (path) => Object.hasOwn(written, path),
    writeFile: (path, contents) => {
      written[path] = contents;
    },
    listRootFiles: () => [...Object.keys(written), "pnpm-lock.yaml"],
    log: (line) => {
      logs.push(line);
    },
  };
  return { io, written, logs };
}

describe("Vue framework and native kit selection", () => {
  it("detects declared Vue and Nuxt while retaining the Angular workspace priority", () => {
    expect(detectFramework({ vue: "^3.5.0", react: "^19.0.0" })).toBe("vue");
    expect(detectFramework({ nuxt: "^4.0.0" })).toBe("vue");
    expect(
      detectFramework(
        { vue: "^3.5.0", "@angular/core": "22.2.0" },
        { hasAngularJson: true }
      )
    ).toBe("angular");
    expect(detectFramework({ "@vue/server-renderer": "3.5.0" })).toBe("react");
  });

  it.each(vueKits.filter((kit) => kit.signals.length > 0))(
    "detects $kit within Vue only",
    (kit) => {
      const dependencies = {
        vue: "^3.5.0",
        [kit.signals[0]!]: "*",
        "@mantine/core": "8",
      };
      expect(detectKit(dependencies, { framework: "vue" })).toBe(kit);
      expect(detectKit(dependencies, { framework: "react" }).kit).toBe(
        "mantine"
      );
    }
  );

  it("detects copied shadcn-vue before its Reka dependency, preserving concrete-kit priority", () => {
    expect(
      detectKit(
        { "reka-ui": "^2.11.0" },
        { framework: "vue", hasComponentsJson: true }
      ).kit
    ).toBe("shadcn-vue");
    expect(
      detectKit({}, { framework: "vue", hasComponentsJson: true }).kit
    ).toBe("shadcn-vue");
    expect(
      detectKit(
        { "element-plus": "^2.14.7", "reka-ui": "^2.11.0" },
        { framework: "vue", hasComponentsJson: true }
      ).kit
    ).toBe("element-plus");
    expect(detectKit({ tailwindcss: "4" }, { framework: "vue" }).kit).toBe(
      "vue-unstyled"
    );
  });

  it.each(vueKits)(
    "writes the $kit native component and its host setup",
    (kit) => {
      const { io, written, logs } = host({ vue: "^3.5.43" });
      const result = runInit(io, { kit: kit.kit });
      expect(result.framework).toBe("vue");
      expect(result.kit).toBe(kit.kit);
      expect(result.adapter).toBe(kit.adapter);
      expect(result.written).toEqual(
        scaffoldFiles(kit).map((file) => file.path)
      );
      expect(starterComponent(kit)).toBe(written["src/PeopleTable.vue"]);
      expect(written["src/PeopleTable.vue"]).toContain(
        `import { DataTable } from "${kit.adapter}"`
      );
      expect(written["src/PeopleTable.vue"]).toContain(
        `import { filters } from "${kit.adapter}/filters"`
      );
      expect(written["src/PeopleTable.vue"]).not.toContain("@adapttable/react");
      expect(result.packages).toEqual(packagesFor(kit));
      expect(logs.join("\n")).toContain(
        "call installAdaptTable(app) before app.mount()"
      );
      expect(logs.join("\n")).toContain(result.installCommand);
      expect(Object.keys(written)).not.toContain("src/PeopleTable.tsx");
    }
  );

  it("preserves a host's provider configuration and user-edited scaffold unless forced", () => {
    const { io, written } = host(
      { vue: "^3.5.43", vuetify: "4.2.4" },
      {
        "src/adapttable.ts": "// My configured plugin",
        "src/PeopleTable.vue": "<template>My table</template>",
        "vite.config.ts": "// My host config",
      }
    );
    const result = runInit(io);
    expect(result.skipped).toEqual([
      "src/PeopleTable.vue",
      "src/adapttable.ts",
    ]);
    expect(result.packages).not.toContain("vuetify@^4.2.4");
    expect(written["src/adapttable.ts"]).toBe("// My configured plugin");
    runInit(io, { force: true });
    expect(written["src/adapttable.ts"]).toContain("createVuetify");
    expect(written["vite.config.ts"]).toBe("// My host config");
  });

  it("rejects a different framework's explicit kit before writing", () => {
    const { io, written } = host({ vue: "^3.5.43" });
    expect(() => runInit(io, { kit: "mantine" })).toThrow(InitError);
    expect(Object.keys(written)).toEqual(["package.json"]);
  });

  it("does not write a plain Vite provider into a Nuxt module application", () => {
    const { io, written } = host(
      { nuxt: "4", "@nuxt/ui": "4" },
      { "nuxt.config.ts": "export default defineNuxtConfig({})" }
    );
    expect(() => runInit(io)).toThrow("Nuxt module/provider setup");
    expect(Object.keys(written)).toEqual(["package.json", "nuxt.config.ts"]);
  });
});
