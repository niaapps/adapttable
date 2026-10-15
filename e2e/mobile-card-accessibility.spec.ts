import { expect, test } from "@playwright/test";

import { builtAdapters, pathOf } from "../apps/showcase/matrix.mjs";
import { expectNoBlockingAxe } from "./axe";

for (const framework of ["react", "angular", "vue"] as const) {
  for (const kit of builtAdapters(framework)) {
    for (const theme of ["light", "dark"] as const) {
      test(`${framework}/${kit.key}: ${theme} cards keep names and readable contrast`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(
          `${framework === "vue" ? "/vue" : ""}/${pathOf(kit)}/mobile-cards/?theme=${theme}`
        );
        const card = page.locator('[data-adapttable-part="card"]').first();
        await expect(card).toBeVisible();
        await card.scrollIntoViewIfNeeded();
        // Read the kit's settled colors, after entry fades and color transitions.
        await card.evaluate(async (element) => {
          await Promise.all(
            element
              .getAnimations({ subtree: true })
              .filter(
                (animation) =>
                  animation.effect?.getComputedTiming().iterations !== Infinity
              )
              .map((animation) => animation.finished.catch(() => undefined))
          );
        });
        await expectNoBlockingAxe(page, '[data-adapttable-part="card"]', {
          colorContrast: true,
        });
      });
    }
  }
}
