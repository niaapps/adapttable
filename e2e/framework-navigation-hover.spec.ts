import { expect, test } from "@playwright/test";

for (const [framework, route] of [
  ["React", "/"],
  ["Angular", "/angular-main/"],
  ["Vue", "/vue-main/"],
] as const) {
  test(`${framework}: Adapters supports mouse discovery, deliberate click and keyboard`, async ({
    page,
  }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const trigger = page.getByRole("button", { name: "Adapters", exact: true });
    await expect(trigger).toBeVisible();
    await trigger.hover();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.mouse.move(5, 200);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await page.mouse.move(5, 200);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
    await trigger.press("ArrowDown");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });
}
