import { expect, test } from "@playwright/test";

import { builtAdapters, pathOf } from "../apps/showcase/matrix.mjs";
import { angularPart } from "./angular-kit";
import { expectNoBlockingAxe } from "./axe";

for (const framework of ["react", "angular", "vue"] as const) {
  for (const kit of builtAdapters(framework)) {
    for (const theme of ["light", "dark"]) {
      test(`${framework}/${kit.key}: ${theme} assistant receipts and controls remain readable`, async ({
        page,
      }) => {
        const route = `${framework === "vue" ? "/vue" : ""}/${pathOf(kit)}/ai/`;
        await page.goto(`${route}?locale=en&theme=${theme}`);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const part = (name: string) =>
          framework === "angular"
            ? angularPart(kit, page, name)
            : page.locator(`[data-adapttable-part="${name}"]`);
        await part("assistant-launcher").click();
        await part("assistant-input").fill(
          framework === "react"
            ? "Sort by salary, highest first."
            : "Sort salaries highest first"
        );
        await part("assistant-input").press("Enter");
        await part("assistant-receipts-toggle-button").last().click();
        await expect(part("assistant-receipt").last()).toBeVisible();
        await expectNoBlockingAxe(
          page,
          '[data-adapttable-part="assistant-surface"]',
          { colorContrast: true }
        );
      });
    }
  }
}
