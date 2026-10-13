import { expect, test } from "@playwright/test";

import {
  VUE_KIT_LAB_PAGES,
  VUE_KIT_PAGES,
  VUE_NATIVE_PAGES,
} from "../apps/showcase/matrix.mjs";

for (const entry of [
  ...VUE_NATIVE_PAGES,
  ...VUE_KIT_PAGES,
  ...VUE_KIT_LAB_PAGES,
]) {
  test(`${entry.path}: standalone example keeps the shared showcase header`, async ({
    page,
  }) => {
    await page.goto(`/${entry.dir}/`);
    const nav = page.locator("#showcase-navigation .nav");
    await expect(nav).toBeVisible();
    await expect(page.locator(".nav")).toHaveCount(1);
    for (const name of [
      "Live demo",
      "Feature Lab",
      "AI demo",
      "Order workspace",
      "Docs",
      "GitHub",
    ])
      await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
    await expect(
      nav.getByRole("combobox", { name: "Framework", exact: true })
    ).toHaveValue("vue");
    await nav.getByRole("button", { name: "Adapters", exact: true }).click();
    await expect(
      nav.getByRole("menu", { name: "Adapters", exact: true })
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      nav.getByRole("button", { name: "Adapters", exact: true })
    ).toBeFocused();
  });
}

for (const width of [1440, 390]) {
  test(`workspace ${width}: theme, locale and return navigation stay connected`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/vue/unstyled/workspace/?theme=light&locale=ar");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator(".workspace-brand")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Toggle dark mode", exact: true })
      .click();
    await expect(page.locator("body")).toHaveAttribute(
      "data-workspace-theme",
      "dark"
    );
    await page.goBack();
    await expect(page.locator("body")).toHaveAttribute(
      "data-workspace-theme",
      "light"
    );
    await page.goForward();
    await expect(page.locator("body")).toHaveAttribute(
      "data-workspace-theme",
      "dark"
    );
    if (width < 600) {
      const picker = page.getByRole("combobox", {
        name: "Demo page",
        exact: true,
      });
      await expect(picker.locator("option:checked")).toHaveText(
        "Order workspace"
      );
      await picker.selectOption({ label: "Feature Lab" });
    } else {
      await page
        .getByRole("link", { name: "Feature Lab", exact: true })
        .click();
    }
    await expect(page).toHaveURL(/vue-all-options/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const query = new URL(page.url()).searchParams;
    expect(query.get("locale")).toBe("ar");
    expect(query.has("view")).toBe(false);
    expect(query.has("lang")).toBe(false);
    await page
      .getByRole("combobox", { name: "Framework", exact: true })
      .selectOption("angular");
    await expect(page).toHaveURL(/angular-all-options/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(
      page.getByRole("combobox", { name: "Framework", exact: true })
    ).toHaveValue("angular");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    ).toBeLessThanOrEqual(1);
  });
}
