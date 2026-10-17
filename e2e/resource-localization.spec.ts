import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { supportedLocales } from "../i18n/config";
import { resourceHref } from "../lib/resource-links";
import type { ResourceContent } from "../lib/resources";

for (const locale of supportedLocales) {
  const content: ResourceContent = JSON.parse(readFileSync(`messages/resources/${locale}.json`, "utf8"));
  const { ui } = content;
  test(`publica siete páginas completas sin JavaScript y enlaces de idioma en ${locale}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ javaScriptEnabled: false, locale: "es-ES", viewport: testInfo.project.use.viewport });
    const page = await context.newPage();
    const paths = ["/recursos", ...content.guides.map(guide => `/recursos/${guide.slug}`), "/recursos/plantilla-refinamiento", "/demo", "/sobre-storyflop"];
    for (const path of paths) {
      const response = await page.goto(resourceHref(locale, path));
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://storyflop.com${resourceHref(locale, path)}`);
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", `https://storyflop.com${resourceHref("en", path)}`);
      await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.goto(resourceHref(locale, "/recursos"));
    await expect(page.locator("h1")).toHaveText(ui.indexTitle);
    for (const guide of content.guides) await expect(page.getByRole("link", { name: new RegExp(guide.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeVisible();
    await expect(page.locator(".resource-header nav").getByRole("link", { name: ui.demoNav, exact: true })).toHaveAttribute("href", resourceHref(locale, "/demo"));
    await page.goto(resourceHref(locale, "/recursos/plantilla-refinamiento"));
    await expect(page.getByLabel(ui.templateLabel)).toContainText(content.templateText.split("\n")[0]);
    await context.close();
  });

  test(`demo, descarga y entrada desde portada mantienen ${locale}`, async ({ page }) => {
    await page.route("**/pagead2.googlesyndication.com/**", route => route.fulfill({ body: "" }));
    await page.goto(`/${locale}`);
    await page.locator(".landing-resources").getByRole("link", { name: new RegExp(ui.landingDemoLink) }).click();
    await expect(page).toHaveURL(new RegExp(resourceHref(locale, "/demo") + "$"));
    await page.getByRole("button", { name: ui.estimate.replace("{value}", "5"), exact: true }).click();
    await page.getByRole("button", { name: ui.reveal, exact: true }).click();
    await expect(page.locator(".demo-results")).toContainText(new Intl.NumberFormat(locale).format(6.5));
    await page.getByRole("button", { name: ui.clarify + " →", exact: true }).click();
    await page.getByRole("button", { name: ui.unsure, exact: true }).click();
    await page.getByRole("button", { name: ui.revealSecond, exact: true }).click();
    await expect(page.getByRole("heading", { name: ui.stopDiscuss })).toBeVisible();
    await page.getByRole("link", { name: ui.saveContext + " →", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(resourceHref(locale, "/recursos/plantilla-refinamiento") + "$"));
    const field = page.getByLabel(ui.templateLabel);
    await expect(field).toHaveValue(new RegExp(`https://storyflop.com${resourceHref(locale, "/recursos/plantilla-refinamiento")}`));
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: ui.download, exact: true }).click();
    const stream = await (await downloadPromise).createReadStream();
    const chunks = [];
    for await (const chunk of stream!) chunks.push(chunk);
    const text = Buffer.concat(chunks).toString("utf8");
    expect(text).toContain(content.templateText.split("\n")[0]);
    expect(text).toContain(`https://storyflop.com${resourceHref(locale, "/recursos/plantilla-refinamiento")}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("cambia el idioma conservando la guía y acepta la URL española anterior", async ({ page }) => {
  await page.goto("/en/recursos/primera-sesion");
  await page.locator(".resource-header select").selectOption("de");
  await expect(page).toHaveURL(/\/de\/recursos\/primera-sesion$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await page.locator(".resource-header select").selectOption("es");
  await expect(page).toHaveURL(/(?<!\/es)\/recursos\/primera-sesion$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  const response = await page.goto("/es/recursos/primera-sesion");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/(?<!\/es)\/recursos\/primera-sesion$/);
});
