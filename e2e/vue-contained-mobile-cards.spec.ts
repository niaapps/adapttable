import { expect, test } from "@playwright/test";

import { builtAdapters, pathOf } from "../apps/showcase/matrix.mjs";

for (const kit of builtAdapters("vue")) {
  test(`${kit.key}: the embedded phone preview keeps cards in one readable column`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/vue/${pathOf(kit)}/mobile-cards/`, {
      waitUntil: "domcontentloaded",
    });
    const cards = page.locator('.mx-demo [data-adapttable-part="card"]');
    await expect(cards.nth(1)).toBeVisible();
    const first = await cards.nth(0).boundingBox();
    const next = await cards.nth(1).boundingBox();
    if (!first || !next) throw new Error("Card preview has no bounds");
    expect(Math.abs(first.x - next.x)).toBeLessThanOrEqual(1);
    expect(next.y).toBeGreaterThanOrEqual(first.y + first.height);
    expect(first.width).toBeGreaterThan(250);
  });
}
