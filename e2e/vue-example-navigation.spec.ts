/** Composed examples retain an entry back to the shared Vue showcase. */
import { expect, test } from "@playwright/test";

import {
  VUE_KIT_LAB_PAGES,
  VUE_KIT_PAGES,
  VUE_NATIVE_PAGES,
} from "../apps/showcase/matrix.mjs";

for (const example of [
  ...VUE_NATIVE_PAGES,
  ...VUE_KIT_PAGES,
  ...VUE_KIT_LAB_PAGES,
]) {
  test(`${example.path}: composed example links back to its kit's live demo and lab`, async ({
    page,
  }) => {
    await page.goto(`/vue/${example.path}/?vue-live.q=stale`);
    const navigation = page.getByRole("navigation", {
      name: "Vue showcase navigation",
    });
    await expect(navigation).toBeVisible();
    const kitPath = example.path.split("/")[0];
    const key = kitPath === "unstyled" ? "vue-unstyled" : kitPath;
    const live = navigation.getByRole("link", {
      name: "Live demo",
      exact: true,
    });
    await expect(live).toHaveAttribute(
      "href",
      new RegExp(`vue-main/\\?kit=${key}$`)
    );
    await expect(
      navigation.getByRole("link", { name: "Feature Lab", exact: true })
    ).toHaveAttribute("href", new RegExp(`vue-all-options/\\?kit=${key}$`));
    await live.click();
    await expect(page).toHaveURL(new RegExp(`/vue-main/\\?kit=${key}$`));
    await expect(
      page.locator('.mx-demo [data-adapttable-part="root"]').first()
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Same features. Any kit. Watch it switch."
    );
  });
}
