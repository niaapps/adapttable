/** Native menus must reserve readable label space and align their controls. */
import { expect, test } from "@playwright/test";

import { builtAdapters, pathOf } from "../apps/showcase/matrix.mjs";
import { getLabels } from "../packages/shared/i18n/src";

for (const kit of builtAdapters("angular")) {
  for (const locale of ["en", "ar"]) {
    test(`${kit.key}: ${locale} column controls align around readable names`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`/${pathOf(kit)}/columns/?locale=${locale}`);
      const labels = getLabels(locale);
      await page
        .getByRole("button", { name: labels.columns, exact: true })
        .click();
      const row = page
        .locator('[data-adapttable-part="column-menu-item"]')
        .first();
      await expect(row).toBeVisible();
      await expect
        .poll(() =>
          row.evaluate((element) => {
            for (
              let parent: Element | null = element;
              parent;
              parent = parent.parentElement
            ) {
              if (
                parent
                  .getAnimations()
                  .some(
                    (animation) =>
                      animation.playState === "running" &&
                      animation.effect?.getComputedTiming().iterations !==
                        Infinity
                  )
              )
                return false;
            }
            return true;
          })
        )
        .toBe(true);
      const panel = page
        .getByRole("dialog", { name: labels.columns, exact: true })
        .or(page.getByRole("group", { name: labels.columns, exact: true }))
        .filter({ visible: true })
        .first();
      // A scrollable popup's fieldset may exceed the visible surface. Include
      // the native wrapper's padding and border in the viewport assertion.
      const bounds = await panel.evaluate((element) =>
        (element.closest(".dropdown-menu") ?? element)
          .getBoundingClientRect()
          .toJSON()
      );
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1281);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(901);
      await expect(row).toBeInViewport({ ratio: 1 });
      const geometry = await row.evaluate((element) => {
        const label = element.querySelector(
          ':scope > span:not([role="button"]):not([data-adapttable-part="column-menu-grip"])'
        )!;
        const name = label.getBoundingClientRect();
        const buttons = [...element.querySelectorAll(":scope > button")].map(
          (button) => button.getBoundingClientRect()
        );
        return {
          labelWidth: name.width,
          readable: label.scrollWidth <= label.clientWidth,
          aligned: buttons.every(
            (button) =>
              Math.abs(
                button.top + button.height / 2 - name.top - name.height / 2
              ) < 2
          ),
          separated: buttons.every(
            (button) =>
              button.right <= name.left + 1 || button.left >= name.right - 1
          ),
        };
      });
      expect(geometry.labelWidth).toBeGreaterThanOrEqual(56);
      expect(geometry.readable).toBe(true);
      expect(geometry.aligned).toBe(true);
      expect(geometry.separated).toBe(true);
      if (kit.key === "angular-cdk") {
        const panel = page.locator(
          '[data-adapttable-part="column-menu-panel"]'
        );
        const height = await panel.evaluate(
          (element) => element.getBoundingClientRect().height
        );
        expect(height).toBeLessThanOrEqual(480);
        await panel
          .locator('[data-adapttable-part="column-menu-item"]')
          .last()
          .scrollIntoViewIfNeeded();
        await expect(
          panel.locator('[data-adapttable-part="column-menu-item"]').last()
        ).toBeInViewport();
        await row.scrollIntoViewIfNeeded();
      }
      await page.screenshot({
        path: info.outputPath(`${kit.key}-${locale}-column-menu.png`),
      });
      await row
        .getByRole("button", { name: new RegExp(labels.columnActions) })
        .click();
      await expect(
        row.locator('[data-adapttable-part="column-menu-submenu"]')
      ).toBeVisible();
    });
  }
}
