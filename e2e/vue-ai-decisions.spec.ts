import { expect, test } from "@playwright/test";

import { builtAdapters, pathOf } from "../apps/showcase/matrix.mjs";

const part = (name: string) => `[data-adapttable-part="${name}"]`;
for (const kit of builtAdapters("vue")) {
  for (const presentation of ["table", "modal"] as const) {
    test(`${kit.key}: ${presentation} AI decisions cancel, approve and continue`, async ({
      page,
    }) => {
      await page.goto(`/vue/${pathOf(kit)}/ai/?theme=light`, {
        waitUntil: "domcontentloaded",
      });
      const control = page.locator(part("demo-approval-surface"));
      const label = presentation === "table" ? "Table" : "Dialog";
      if (kit.key === "reka-ui" || kit.key === "shadcn-vue") {
        await control.getByRole("button", { name: label, exact: true }).click();
      } else if (await control.evaluate((e) => e.tagName === "SELECT"))
        await control.selectOption(presentation);
      else {
        await control.click();
        await page.getByRole("option", { name: label, exact: true }).click();
      }
      await page.locator(part("assistant-launcher")).click();
      const ask = async (text: string) => {
        await page.locator(part("assistant-input")).fill(text);
        await page.locator(part("assistant-input")).press("Enter");
      };
      await ask("Propose Grace's salary as 150");
      await expect(page.locator(part("agent-approval-approve"))).toHaveCount(1);
      await expect(page.locator("[data-demo-log]")).toHaveText(
        "No host writes yet"
      );
      if (presentation === "modal") await page.keyboard.press("Escape");
      else await page.locator(part("agent-approval-reject")).click();
      await expect(page.locator(part("agent-approval-approve"))).toHaveCount(0);
      await expect(page.locator("[data-demo-log]")).toHaveText(
        "No host writes yet"
      );
      await ask("Propose Grace's salary as 150");
      await page.locator(part("agent-approval-approve")).click();
      await expect(page.locator("[data-demo-log]")).toHaveText(
        "Grace Hopper salary saved: 150"
      );
      await ask("Wait for cancellation");
      await page.locator(part("assistant-stop")).click();
      await expect(page.locator(part("assistant-send"))).toBeVisible();
      await ask("Sort salaries highest first");
      await expect(
        page.locator(part("assistant-message-text")).last()
      ).toContainText("Highest salary first");
    });
  }
}
