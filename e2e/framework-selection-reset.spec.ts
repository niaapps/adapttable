import { expect, test } from "@playwright/test";

import { builtAdapters, pathOf } from "../apps/showcase/matrix.mjs";

for (const framework of ["react", "angular", "vue"] as const) {
  for (const kit of builtAdapters(framework)) {
    test(`${framework}/${kit.key}: search resets selected rows without reviving them on return`, async ({
      page,
    }) => {
      const route = `${framework === "vue" ? "/vue" : ""}/${pathOf(kit)}/selection/`;
      await page.goto(`${route}?locale=en&theme=light`);
      const cells = page.locator('[data-adapttable-part="selection-cell"]');
      const first = cells.first().getByRole("checkbox").first();
      await first.focus();
      await first.press("Space");
      await expect(first).toBeChecked();
      const searchPart = page
        .locator('[data-adapttable-part="search"]')
        .first();
      const search = (await searchPart.evaluate((element) =>
        element.matches("input")
      ))
        ? searchPart
        : searchPart.locator("input");
      await search.fill("no-person-matches-this-query");
      await expect(cells).toHaveCount(0);
      await search.fill("");
      // Element Plus exposes a visually hidden native input inside its visible label.
      await expect(cells.first()).toBeVisible();
      await expect(first).not.toBeChecked();
    });
  }
}
