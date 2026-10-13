import { expect, test } from "@playwright/test";
for (const [framework, route] of [
  ["Angular", "/unstyled/ai/"],
  ["Vue", "/vue/unstyled/ai/"],
] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`${framework}: explicit ${theme} link overrides storage and stays aligned after toggling`, async ({
      page,
    }) => {
      await page.addInitScript(
        (value) => window.localStorage.setItem("adapttable-demo-theme", value),
        theme === "light" ? "dark" : "light"
      );
      await page.goto(`${route}?theme=${theme}&locale=en`, {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.locator('.ai-demo [data-adapttable-part="root"]')
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(
        await page
          .locator("html")
          .evaluate((element) => element.classList.contains("dark"))
      ).toBe(theme === "dark");
      await page
        .getByRole("button", { name: "Toggle dark mode", exact: true })
        .click();
      const next = theme === "dark" ? "light" : "dark";
      await expect(page.locator("html")).toHaveAttribute("data-theme", next);
      expect(new URL(page.url()).searchParams.get("theme")).toBe(next);
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(
        page.locator('.ai-demo [data-adapttable-part="root"]')
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", next);
    });
  }
}
