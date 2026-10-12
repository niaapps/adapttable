import { expect, test } from "@playwright/test";

import { builtAdapters } from "../apps/showcase/matrix.mjs";

for (const framework of ["vue", "angular"] as const) {
  for (const kit of builtAdapters(framework)) {
    test(`${framework} ${kit.key}: grouping controls stay compact and fit small screens`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`/${framework}-main/?kit=${kit.key}&grouping=on`);
      const panel = page.locator('[data-adapttable-part="grouping-panel"]');
      await expect(panel).toBeVisible();
      const desktop = await panel.boundingBox();
      expect(desktop?.height).toBeLessThan(220);
      const operation = panel
        .locator('[data-adapttable-part="grouping-aggregation-operation"]')
        .first();
      await expect(operation).toBeVisible();
      expect((await operation.boundingBox())?.width).toBeLessThan(230);
      const operationBox = await operation.boundingBox();
      const removeBox = await panel
        .getByRole("button", { name: "Remove Budget aggregation", exact: true })
        .boundingBox();
      expect(operationBox).not.toBeNull();
      expect(removeBox).not.toBeNull();
      expect(
        Math.abs(
          (operationBox?.y ?? 0) +
            (operationBox?.height ?? 0) / 2 -
            (removeBox?.y ?? 0) -
            (removeBox?.height ?? 0) / 2
        )
      ).toBeLessThan(16);

      // Controls stay usable after removing and restoring the default aggregate.
      await panel
        .getByRole("button", { name: "Remove Budget aggregation", exact: true })
        .click();
      await expect(operation).toHaveCount(0);
      if (framework === "vue") {
        await panel
          .locator('[data-adapttable-part="grouping-aggregation-add"]')
          .getByText("Budget", { exact: true })
          .click();
        await expect(
          panel.getByRole("checkbox", { name: "Budget", exact: true })
        ).toBeChecked();
        await expect(operation).toBeVisible();
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await expect
        .poll(async () =>
          panel.evaluate((element) => ({
            left: element.getBoundingClientRect().left,
            right: element.getBoundingClientRect().right,
            overflow: element.scrollWidth - element.clientWidth,
          }))
        )
        .toMatchObject({ overflow: 0 });
      const phone = await panel.boundingBox();
      expect(phone?.x).toBeGreaterThanOrEqual(0);
      expect((phone?.x ?? 0) + (phone?.width ?? 0)).toBeLessThanOrEqual(390);
      await page.getByRole("radio", { name: "العربية", exact: true }).check();
      await expect(panel).toHaveAttribute("dir", "rtl");
      await expect
        .poll(() =>
          panel.evaluate((element) => element.scrollWidth - element.clientWidth)
        )
        .toBe(0);
    });
  }
}

test("Element Plus column actions have usable hit areas", async ({ page }) => {
  await page.goto("/vue-main/?kit=element-plus");
  await page.getByRole("button", { name: "Columns", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Columns", exact: true });
  for (const name of [
    "Hide column: Person",
    "Pin to start: Person",
    "Column actions: Person",
  ]) {
    const box = await dialog
      .getByRole("button", { name, exact: true })
      .boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(32);
    expect(box?.height).toBeGreaterThanOrEqual(32);
  }
});

test("switching from Quasar to Nuxt leaves checkbox labels beside their controls", async ({
  page,
}) => {
  await page.goto("/vue-main/?kit=quasar&grouping=on");
  await page
    .getByRole("button", {
      name: "Nuxt UI Tailwind-native, Nuxt green",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("pnpm add @adapttable/nuxt-ui", { exact: true })
  ).toBeVisible();
  const picker = page.locator(
    '[data-adapttable-part="grouping-aggregation-add"]'
  );
  const checkbox = picker.getByRole("checkbox", {
    name: "Budget",
    exact: true,
  });
  const label = picker.getByText("Budget", { exact: true });
  const fieldBox = await checkbox.boundingBox();
  const labelBox = await label.boundingBox();
  expect(fieldBox).not.toBeNull();
  expect(labelBox).not.toBeNull();
  expect(Math.abs((fieldBox?.y ?? 0) - (labelBox?.y ?? 0))).toBeLessThan(8);
  await label.click();
  await expect(checkbox).not.toBeChecked();
  await page
    .getByRole("button", {
      name: "Quasar Material-flavoured, Quasar blue",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("pnpm add @adapttable/quasar", { exact: true })
  ).toBeVisible();
  await expect(
    page
      .locator('[data-adapttable-part="grouping-aggregation-add"]')
      .getByRole("checkbox", { name: "Budget", exact: true })
  ).toBeVisible();
});
