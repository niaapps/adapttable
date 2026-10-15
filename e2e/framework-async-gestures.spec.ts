import { expect, test } from "@playwright/test";

import { builtAdapters, pathOf } from "../apps/showcase/matrix.mjs";

for (const framework of ["angular", "vue"]) {
  for (const kit of builtAdapters(framework)) {
    test(`${kit.key}: Caps Lock paste and fill announce rejected saves without creating undo history`, async ({
      page,
      context,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.goto(
        `${framework === "vue" ? "/vue" : ""}/${pathOf(kit)}/editing/?locale=en`
      );
      const first = page.locator('[data-grid-cell="0:0"]');
      const reject = page.getByRole("button", {
        name: "Reject next save",
        exact: true,
      });
      const announcement = page.locator(
        '[data-adapttable-part="grid-announcer"]'
      );
      const undo = page.locator('[data-adapttable-part="undo-button"]');
      await reject.click();
      await page.evaluate(() =>
        navigator.clipboard.writeText("Rejected paste")
      );
      await first.focus();
      await page.keyboard.press("Control+V");
      await expect(announcement).toHaveText("Paste failed");
      await expect(undo).toBeDisabled();
      await reject.click();
      await first.focus();
      await page.keyboard.press("Shift+ArrowDown");
      await page.keyboard.press("Control+D");
      await expect(announcement).toHaveText("Fill failed");
      await expect(undo).toBeDisabled();
      expect(errors).toEqual([]);
    });
  }
}
