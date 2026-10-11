import { expect, test } from "@playwright/test";

test.use({ baseURL: "http://localhost:4323" });

const TRACKERS = [
  "googletagmanager.com",
  "google-analytics.com",
  "analytics.google.com",
  "clarity.ms",
  "cloudflareinsights.com",
];

for (const path of [
  "/",
  "/react/getting-started/",
  "/angular/getting-started/",
  "/vue/getting-started/",
]) {
  test(`built docs send no analytics from localhost ${path}`, async ({
    page,
  }) => {
    const calls: string[] = [];
    page.on("request", (request) => {
      if (TRACKERS.some((host) => request.url().includes(host)))
        calls.push(request.url());
    });
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);
    expect(calls).toEqual([]);
    // Prove the local guard runs on a build that includes production tracking.
    const html = await page.content();
    expect(html).toContain("googletagmanager.com");
    expect(html).toContain("clarity.ms");
  });
}
