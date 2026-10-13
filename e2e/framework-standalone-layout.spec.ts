import { expect, test } from "@playwright/test";

import { matrixPages } from "../apps/showcase/matrix.mjs";
import { SHOWCASE_PAGES } from "../apps/showcase/pages.mjs";

const matrixHtml = new Set(
  matrixPages().map((page) => `./${page.dir}/index.html`)
);
const standalonePages = SHOWCASE_PAGES.filter(
  (page) =>
    ["vue", "angular"].includes(page.framework ?? "") &&
    !matrixHtml.has(page.html)
);
for (const entry of standalonePages) {
  for (const width of [1440, 390]) {
    test(`${entry.key}: ${width}px standalone page mounts its controls within the viewport`, async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 1000 });
      const route = entry.html
        .replace(/^\.\//, "/")
        .replace(/index\.html$/, "");
      const locale = width === 390 ? "ar" : "en";
      await page.goto(
        `${route}?locale=${locale}&lang=${locale}&theme=${width === 390 ? "dark" : "light"}`,
        { waitUntil: "domcontentloaded" }
      );
      await expect(page.getByRole("banner").first()).toBeVisible();
      await expect(
        page.locator('[data-adapttable-part="root"]').first()
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1 }).first()
      ).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth
          )
        )
        .toBeLessThanOrEqual(1);
      if (entry.key === "vue-unstyled-assistant" && width === 1440) {
        const table = await page
          .locator('[data-adapttable-part="root"]')
          .boundingBox();
        const assistant = await page
          .locator('[data-adapttable-part="assistant-panel"]')
          .boundingBox();
        if (!table || !assistant)
          throw new Error("The standalone assistant workspace has no bounds");
        expect(assistant.x).toBeGreaterThan(table.x + table.width);
        expect(Math.abs(assistant.y - table.y)).toBeLessThanOrEqual(2);
      }
      await info.attach("standalone-page", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      expect(errors).toEqual([]);
    });
  }
}
