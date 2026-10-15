import { expect, test } from "@playwright/test";

import { builtAdapters, pathOf } from "../apps/showcase/matrix.mjs";
import { angularPart } from "./angular-kit";

const endpoint = "http://127.0.0.1:8787";
const selector = (name: string) => `[data-adapttable-part="${name}"]`;

for (const framework of ["angular", "vue"] as const) {
  for (const kit of builtAdapters(framework)) {
    test(`${framework}/${kit.key}: backend retry, execution, undo and disconnect`, async ({
      page,
    }) => {
      let unavailable = true;
      let turns = 0;
      await page.route(endpoint, async (route) => {
        if (unavailable) {
          await route.abort("failed");
          return;
        }
        const body = route.request().postDataJSON() as { kind?: string };
        if (body.kind === "turn") turns++;
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            schemaVersion: "adapttable.agent.v1",
            ok: true,
            text: body.kind === "hello" ? "Ready" : "Backend sorted salaries.",
            ...(body.kind === "turn"
              ? {
                  toolCalls: [
                    {
                      id: `salary-${String(turns)}`,
                      name: "view.setSort",
                      args: { key: "salary", dir: "desc" },
                    },
                  ],
                }
              : {}),
          }),
        });
      });
      const route =
        framework === "vue" ? `/vue/${pathOf(kit)}/ai/` : `/${kit.key}/ai/`;
      await page.goto(`${route}?theme=light&locale=en`, {
        waitUntil: "domcontentloaded",
      });
      const part = (name: string) =>
        framework === "angular"
          ? angularPart(kit, page, name)
          : page.locator(selector(name));
      await page
        .getByRole("button", { name: "Connect a backend", exact: true })
        .click();
      await page.getByLabel("Your endpoint", { exact: true }).fill(endpoint);
      await page
        .getByRole("button", { name: "Connect backend", exact: true })
        .click();
      const settings = page.getByRole("region", { name: "Backend connection" });
      await expect(settings.getByRole("alert")).toBeVisible();
      unavailable = false;
      await page
        .getByRole("button", { name: "Retry connection", exact: true })
        .click();
      await expect(page.locator("[data-demo-ai-connection]")).toContainText(
        "Backend:"
      );
      await part("assistant-launcher").click();
      const ask = async (text: string) => {
        await part("assistant-input").fill(text);
        await part("assistant-input").press("Enter");
      };
      await ask("Use my backend to sort salaries");
      await expect(part("assistant-message-text").last()).toHaveText(
        "Backend sorted salaries."
      );
      await expect(
        page.getByRole("columnheader").filter({ hasText: "Salary" })
      ).toHaveAttribute("aria-sort", "descending");
      await part("assistant-receipts-toggle-button").last().click();
      await expect(part("assistant-receipt").last()).toHaveAttribute(
        "data-status",
        "executed"
      );
      await part("assistant-receipt-undo-button").last().click();
      await expect(
        page.getByRole("columnheader").filter({ hasText: "Salary" })
      ).toHaveAttribute("aria-sort", "none");
      await part("assistant-close").click();
      await page
        .getByRole("button", { name: "Use scripted demo", exact: true })
        .click();
      await expect(page.locator("[data-demo-ai-connection]")).toContainText(
        "Scripted demo"
      );
      await part("assistant-launcher").click();
      await ask("Sort salaries highest first");
      await expect(part("assistant-message-text").last()).toHaveText(
        "Highest salary first."
      );
      expect(turns).toBe(1);
    });
  }
}
