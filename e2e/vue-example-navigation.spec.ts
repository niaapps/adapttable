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
    await page.goto(
      `/vue/${example.path}/?theme=light&locale=en&vue-live.q=stale`
    );
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
    for (const [link, path] of [
      [live, "/vue-main/"],
      [
        navigation.getByRole("link", { name: "Feature Lab", exact: true }),
        "/vue-all-options/",
      ],
    ] as const) {
      const destination = new URL(
        (await link.getAttribute("href"))!,
        page.url()
      );
      expect(destination.pathname).toBe(path);
      expect(Object.fromEntries(destination.searchParams)).toEqual({
        kit: key,
        theme: "light",
        locale: "en",
      });
    }
    await live.click();
    await expect(page).toHaveURL(/\/vue-main\/\?/);
    expect(Object.fromEntries(new URL(page.url()).searchParams)).toEqual({
      kit: key,
      theme: "light",
      locale: "en",
    });
    await expect(
      page.locator('.mx-demo [data-adapttable-part="root"]').first()
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Same features. Any kit. Watch it switch."
    );
  });
}
