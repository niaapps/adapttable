/** Audit the served current guides, not just metadata source dictionaries. */
import { expect, test } from "@playwright/test";

import { DOCS } from "../../scripts/build-llms-full.mjs";
import { docsRoute, ORIGIN } from "../../scripts/site.mjs";

test.use({ baseURL: "http://localhost:4323" });

test("every current guide has distinct, crawlable metadata and a real social image", async ({
  page,
  request,
}) => {
  const routes = DOCS.map((file) => docsRoute(file));
  const documents = new Array<string>(routes.length);
  await Promise.all(
    Array.from({ length: 6 }, async (_, lane) => {
      for (let index = lane; index < routes.length; index += 6) {
        const response = await request.get(routes[index]!);
        expect(response.ok(), routes[index]).toBe(true);
        documents[index] = await response.text();
        await response.dispose();
      }
    })
  );
  const metadata = await page.evaluate(
    (documents) =>
      documents.map((html) => {
        const dom = new DOMParser().parseFromString(html, "text/html");
        const content = (name: string) =>
          dom
            .querySelector(`meta[name="${name}"], meta[property="${name}"]`)
            ?.getAttribute("content");
        return {
          title: dom.title,
          description: content("description"),
          canonical: dom
            .querySelector('link[rel="canonical"]')
            ?.getAttribute("href"),
          ogUrl: content("og:url"),
          ogTitle: content("og:title"),
          ogDescription: content("og:description"),
          image: content("og:image"),
          robots: content("robots"),
          headings: dom.querySelectorAll("main h1").length,
          words:
            dom
              .querySelector("main .sl-markdown-content")
              ?.textContent?.split(/\s+/).length ?? 0,
        };
      }),
    documents
  );
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (let index = 0; index < metadata.length; index++) {
    const item = metadata[index]!;
    const route = routes[index]!;
    expect(item.title, route).toBeTruthy();
    expect(item.title.length, route).toBeLessThanOrEqual(95);
    expect(item.description, route).toBeTruthy();
    expect(item.description!.length, route).toBeGreaterThanOrEqual(60);
    expect(item.description!.length, route).toBeLessThanOrEqual(180);
    expect(item.canonical, route).toBe(ORIGIN + route);
    expect(item.ogUrl, route).toBe(item.canonical);
    expect(item.ogTitle, route).toBe(item.title.replace(/ \| AdaptTable$/, ""));
    expect(item.ogDescription, route).toBe(item.description);
    expect(item.robots, route).not.toContain("noindex");
    expect(item.headings, route).toBe(1);
    expect(item.words, route).toBeGreaterThan(60);
    expect(titles.has(item.title), `duplicate title at ${route}`).toBe(false);
    expect(
      descriptions.has(item.description!),
      `duplicate description at ${route}`
    ).toBe(false);
    titles.add(item.title);
    descriptions.add(item.description!);
    expect(item.image, route).toBeTruthy();
    const image = await request.get(new URL(item.image!).pathname);
    expect(image.ok(), `missing social image at ${route}`).toBe(true);
    expect(image.headers()["content-type"]).toContain("image/png");
    await image.dispose();
  }
});
