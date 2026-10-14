/** Navigation is shared by every kit: reset page state, preserve presentation. */
import { expect, type Page, test } from "@playwright/test";

import { builtAdapters } from "../apps/showcase/matrix.mjs";

const modes = {
  react: { live: "/", lab: "/all-options/" },
  angular: { live: "/angular-main/", lab: "/angular-all-options/" },
  vue: { live: "/vue-main/", lab: "/vue-all-options/" },
} as const;
const searchSelector =
  'input[data-adapttable-part="search"], [data-adapttable-part="search"] input';

async function expectCompact(
  page: Page,
  framework: keyof typeof modes
): Promise<void> {
  if (framework !== "react") {
    await expect(
      page.locator('[data-adapttable-part="root"]').first()
    ).toHaveAttribute("data-density", "compact");
    return;
  }
  const configure = page.getByRole("button", {
    name: "Configure options",
    exact: true,
  });
  const lab = (await configure.count()) > 0;
  if (lab) await configure.click();
  await expect(
    page
      .getByRole("group", { name: "density", exact: true })
      .getByRole("button", { name: "Compact", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  if (lab) await page.keyboard.press("Escape");
}

for (const framework of ["react", "angular", "vue"] as const) {
  for (const kit of builtAdapters(framework)) {
    test(`${framework}/${kit.key}: page and framework switches clear queries and retain preferences`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(
        `${modes[framework].live}?kit=${kit.key}&locale=en&density=compact&theme=dark&foreign.q=stale&grouping=off`
      );
      const search = page.locator(searchSelector).first();
      await expect(search).toBeVisible();
      await search.fill("Ada");
      await expect
        .poll(() =>
          [...new URL(page.url()).searchParams].some(
            ([key, value]) => key.endsWith(".q") && value === "Ada"
          )
        )
        .toBe(true);
      const previous = page.url();
      await page
        .getByRole("link", { name: "Feature Lab", exact: true })
        .click();
      await expect(page).toHaveURL(
        new RegExp(modes[framework].lab.replaceAll("/", "\\/") + "\\?")
      );
      await expect(search).toBeVisible();
      let query = new URL(page.url()).searchParams;
      expect(query.get("kit")).toBe(kit.key);
      expect(query.get("locale")).toBe("en");
      expect(query.get("density")).toBe("compact");
      expect(query.get("theme")).toBe("dark");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      expect(
        [...query.keys()].filter(
          (key) => !["kit", "locale", "density", "theme"].includes(key)
        )
      ).toEqual([]);
      await expect(search).toHaveValue("");
      await expectCompact(page, framework);
      await page.goBack();
      await expect(page).toHaveURL(previous);
      await expect(search).toHaveValue("Ada");
      await page.goForward();
      await expect(search).toHaveValue("");
      for (const next of ["react", "angular", "vue"] as const) {
        if (next === framework) continue;
        await page
          .getByRole("combobox", { name: "Framework", exact: true })
          .selectOption(next);
        await expect(page).toHaveURL(
          new RegExp(modes[next].lab.replaceAll("/", "\\/") + "\\?")
        );
        await expect(page.locator(searchSelector).first()).toBeVisible();
        await expect(
          page.getByRole("combobox", { name: "Framework", exact: true })
        ).toHaveValue(next);
        query = new URL(page.url()).searchParams;
        expect(query.get("locale")).toBe("en");
        expect(query.get("density")).toBe("compact");
        expect(query.get("theme")).toBe("dark");
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          "dark"
        );
        await expectCompact(page, next);
        expect(query.has("foreign.q")).toBe(false);
        expect([...query.keys()].some((key) => key.endsWith(".q"))).toBe(false);
      }
      expect(errors).toEqual([]);
    });
  }
}

for (const framework of ["vue", "angular"] as const) {
  test(`${framework}: every kit preserves search and the document through forward and reverse switches`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const kits = builtAdapters(framework);
    const firstKit = kits[0];
    if (!firstKit) throw new Error(`No registered ${framework} kits`);
    await page.goto(`${modes[framework].live}?kit=${firstKit.key}&editing=off`);
    const search = page.locator(searchSelector).first();
    await search.fill("Ada");
    await expect
      .poll(() =>
        [...new URL(page.url()).searchParams.values()].includes("Ada")
      )
      .toBe(true);
    const origin = await page.evaluate(() => performance.timeOrigin);
    for (const kit of [...kits, ...[...kits].reverse()]) {
      if (framework === "vue")
        await page.locator(`[data-demo-control="kit-${kit.key}"]`).click();
      else
        await page.getByRole("radio", { name: kit.label, exact: true }).check();
      await expect(page.locator(`[data-adapter="${kit.key}"]`)).toBeVisible();
      await expect(search).toHaveValue("Ada");
      await expect(
        page.locator('[data-adapttable-part="row"][data-row-id]')
      ).toHaveCount(1);
      expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
    }
  });
}

test("React lab kit selection updates navigation links immediately", async ({
  page,
}) => {
  await page.goto("/all-options/?kit=mantine&locale=en");
  await page.getByTestId("adapter-mui").click();
  await expect(page.locator('[data-adapter="mui"]')).toBeVisible();
  await page.getByRole("link", { name: "Live demo", exact: true }).click();
  await expect(page).toHaveURL(/\/?kit=mui&locale=en/);
  await expect(page.getByTestId("adapter-mui")).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

for (const framework of ["angular", "vue"] as const) {
  test(`${framework}: desktop and phone navigation protect an invalid draft`, async ({
    page,
  }) => {
    const kit = framework === "vue" ? "vue-unstyled" : "unstyled";
    await page.goto(`${modes[framework].live}?kit=${kit}`);
    const cell = page
      .locator('[data-adapttable-part="row"][data-row-id]')
      .first()
      .locator('[data-adapttable-part="cell"]')
      .first();
    await cell.dblclick();
    const editor = page.locator('[data-adapttable-part="edit-cell-editor"]');
    await editor.fill("");
    const original = page.url();
    await page
      .getByRole("combobox", { name: "Framework", exact: true })
      .selectOption("react");
    const warning = page.getByRole("alertdialog", {
      name: "Finish editing before switching",
    });
    await expect(warning).toBeVisible();
    await expect(page).toHaveURL(original);
    await expect(
      page.getByRole("combobox", { name: "Framework", exact: true })
    ).toHaveValue(framework);
    await warning.getByRole("button", { name: "Return to editing" }).click();
    await page.getByRole("link", { name: "Feature Lab", exact: true }).click();
    await expect(warning).toBeVisible();
    await expect(page).toHaveURL(original);
    await warning.getByRole("button", { name: "Return to editing" }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    const picker = page.getByRole("combobox", {
      name: "Demo page",
      exact: true,
    });
    const originalSelection = await picker.inputValue();
    await picker.selectOption({ label: "Feature Lab" });
    await expect(warning).toBeVisible();
    await expect(page).toHaveURL(original);
    await expect(picker).toHaveValue(originalSelection);
    await warning.getByRole("button", { name: "Return to editing" }).click();
    await expect(editor).toHaveValue("");
    await editor.press("Escape");
    await expect(editor).toHaveCount(0);
    await picker.selectOption({ label: "Feature Lab" });
    await expect(page).toHaveURL(new RegExp(modes[framework].lab));
    await expect(page.locator(searchSelector).first()).toBeVisible();
  });
}

for (const framework of ["react", "angular", "vue"] as const) {
  test(`${framework}: Arabic compact preferences survive phone page and framework switching`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const kit = { react: "mui", angular: "material", vue: "vuetify" }[
      framework
    ];
    await page.goto(
      `${modes[framework].live}?kit=${kit}&locale=ar&density=compact&foreign.page=9`
    );
    const table = page.locator('[data-adapttable-part="root"]').first();
    await expect(table).toHaveAttribute("dir", "rtl");
    await expectCompact(page, framework);
    await page
      .getByRole("combobox", { name: "Demo page", exact: true })
      .selectOption({ label: "Feature Lab" });
    await expect(page).toHaveURL(new RegExp(modes[framework].lab));
    await expect(table).toHaveAttribute("dir", "rtl");
    await expectCompact(page, framework);
    expect(new URL(page.url()).searchParams.has("foreign.page")).toBe(false);
    const next = framework === "vue" ? "react" : "vue";
    await page
      .getByRole("combobox", { name: "Framework", exact: true })
      .selectOption(next);
    await expect(page).toHaveURL(new RegExp(modes[next].lab));
    await expect(table).toHaveAttribute("dir", "rtl");
    await expectCompact(page, next);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    ).toBeLessThanOrEqual(1);
  });
}
