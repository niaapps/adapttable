import { expect, test } from "@playwright/test";

import { ANGULAR_KITS, angularPart, checkAngularCheckbox } from "./angular-kit";

for (const kit of ANGULAR_KITS) {
  for (const feature of [
    { slug: "row-reordering", column: "reorder" },
    { slug: "nested-tables", column: "expand" },
  ]) {
    test(`${kit.key}: ${feature.column} controls stay compact and reachable in LTR and RTL`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1920, height: 1000 });
      for (const locale of ["en", "ar"]) {
        await page.goto(`/${kit.key}/${feature.slug}/?locale=${locale}`);
        const header = angularPart(
          kit,
          page,
          `${feature.column}-header`
        ).first();
        const cell = angularPart(kit, page, `${feature.column}-cell`).first();
        await expect(header).toBeVisible();
        await expect(cell).toBeVisible();
        expect((await header.boundingBox())!.width).toBeLessThanOrEqual(72);
        expect((await cell.boundingBox())!.width).toBeLessThanOrEqual(72);
        await cell.getByRole("button").click({ trial: true });
      }
    });
  }
  test(`${kit.key}: selection columns retain compact geometry across desktop densities and RTL`, async ({
    page,
  }, info) => {
    for (const variant of [
      { width: 1280, density: "comfortable", locale: "en" },
      { width: 1920, density: "comfortable", locale: "en" },
      { width: 1920, density: "compact", locale: "ar" },
    ]) {
      await page.setViewportSize({ width: variant.width, height: 1000 });
      await page.goto(
        `/angular-all-options/?kit=${kit.key}&mobile=off&density=${variant.density}&locale=${variant.locale}`
      );
      const header = angularPart(kit, page, "selection-header");
      const cell = angularPart(kit, page, "selection-cell").first();
      await expect(header).toBeVisible();
      await expect(cell).toBeVisible();
      const geometry = await header.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const input = element.querySelector(
          '[role="checkbox"], input[type="checkbox"]'
        )!;
        const checkbox = input.getBoundingClientRect();
        return {
          width: rect.width,
          controlWidth: checkbox.width,
          inset: checkbox.left - rect.left,
        };
      });
      await info.attach(
        `${variant.width}-${variant.density}-${variant.locale}-geometry`,
        { body: JSON.stringify(geometry), contentType: "application/json" }
      );
      await page.screenshot({
        path: info.outputPath(
          `${variant.width}-${variant.density}-${variant.locale}.png`
        ),
        fullPage: true,
      });
      expect(geometry.width).toBeLessThanOrEqual(64);
      expect(geometry.width).toBeGreaterThanOrEqual(geometry.controlWidth);
      expect(geometry.inset).toBeGreaterThanOrEqual(0);
      expect(geometry.inset + geometry.controlWidth).toBeLessThanOrEqual(
        geometry.width
      );
      expect((await cell.boundingBox())!.width).toBeCloseTo(geometry.width, 0);
      await checkAngularCheckbox(kit, cell.getByRole("checkbox"));
      await expect(cell.getByRole("checkbox")).toBeChecked();
      expect((await header.boundingBox())!.width).toBeLessThanOrEqual(64);
    }
  });
}
