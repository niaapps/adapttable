import { expect, test } from "@playwright/test";

const kits = [
  "unstyled",
  "ng-zorro",
  "material",
  "ng-bootstrap",
  "aria",
  "ngx-bootstrap",
  "angular-cdk",
  "spartan",
  "taiga-ui",
];

for (const kit of kits) {
  test(`${kit}: keyboard focus follows the virtual window without runaway loading`, async ({
    page,
  }) => {
    await page.goto(
      `/angular-all-options/?kit=${kit}&dataset=large&navigation=on&locale=en`
    );
    const first = page.locator('[data-grid-cell="0:0"]');
    await expect(first).toBeVisible();
    await first.click();
    await page.keyboard.press("Control+End");
    await expect(page.locator('[data-grid-cell="99:4"]')).toBeFocused();
    await expect(
      page.locator('[data-adapttable-part="load-more"]')
    ).toHaveCount(0);
    // Keep the destination through the post-render measurement and next-page
    // load, which previously moved the viewport away and removed DOM focus.
    await expect
      .poll(async () =>
        page.locator('[data-grid-cell="99:4"]').evaluate((cell) => {
          const box = cell.closest('[data-adapttable-part="scroll-box"]');
          if (!box) return false;
          const viewport = box.getBoundingClientRect();
          const rect = cell.getBoundingClientRect();
          return rect.top >= viewport.top && rect.bottom <= viewport.bottom;
        })
      )
      .toBe(true);
    await page.keyboard.press("Control+Home");
    await expect(first).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator('[data-grid-cell="1:0"]')).toBeFocused();
  });
}
