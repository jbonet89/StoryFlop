import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { supportedLocales } from "../i18n/config";
import { resourceHref } from "../lib/resource-links";
import type { ResourceContent } from "../lib/resources";

for (const locale of supportedLocales) {
  const { ui, guides }: ResourceContent = JSON.parse(readFileSync(`messages/resources/${locale}.json`, "utf8"));
  test(`casos y cálculos interactivos correctos en ${locale}`, async ({ page }) => {
    await page.route("**/api/resource-usage", route => route.fulfill({ status: 204 }));
    await page.goto(resourceHref(locale, "/recursos/dividir-historias"));
    await expect(page.locator(".worked-case")).toHaveCount(3);
    await expect(page.locator(".worked-cases")).toContainText(ui.fictionalCaseLabel);
    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(data["@graph"][0].inLanguage).toBe(locale);
    expect(data["@graph"][0].headline).toBe(guides.find(guide => guide.slug === "dividir-historias")!.title);
    await page.goto(resourceHref(locale, "/recursos/interpretar-resultados"));
    const select = page.getByLabel(ui.labScenario);
    const format = (n: number) => new Intl.NumberFormat(locale).format(n);
    await expect(page.locator('[data-stat="mean"]')).toHaveText(format(7));
    await expect(page.locator('[data-stat="median"]')).toHaveText(format(5));
    await select.selectOption("1");
    await expect(page.locator('[data-stat="mean"]')).toHaveText(format(9));
    await expect(page.locator('[data-stat="median"]')).toHaveText(format(5));
    await select.selectOption("2");
    await expect(page.locator('[data-stat="mean"]')).toHaveText(format(2.5));
    await expect(page.locator('[data-stat="median"]')).toHaveText(format(2.5));
    await select.selectOption("3");
    await expect(page.locator('[data-stat="mean"]')).toHaveText(ui.unavailable);
    await expect(page.locator('[data-stat="median"]')).toHaveText(ui.unavailable);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("mide acciones completas sin enviar contenido de la ficha", async ({ page }) => {
  const events: Record<string, string>[] = [];
  await page.route("**/api/resource-usage", async route => { events.push(route.request().postDataJSON()); await route.fulfill({ status: 204 }); });
  await page.goto("/demo");
  await expect.poll(() => events.some(event => event.event === "resource_view")).toBe(true);
  await page.getByRole("button", { name: "Estimar 5", exact: true }).click();
  await page.getByRole("button", { name: "Revelar votos", exact: true }).click();
  await page.getByRole("button", { name: "Aclarar el alcance y repetir →", exact: true }).click();
  await page.getByRole("button", { name: "Estimar 5", exact: true }).click();
  await page.getByRole("button", { name: "Revelar segunda ronda", exact: true }).click();
  await expect.poll(() => events.filter(event => event.event === "demo_started").length).toBe(1);
  await expect.poll(() => events.filter(event => event.event === "demo_completed").length).toBe(1);
  await page.getByRole("link", { name: "Guardar el contexto con la plantilla →" }).click();
  await page.getByLabel("Plantilla de la sesión").fill("private-test@example.com / ROOM-PRIVATE / private story");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar .txt" }).click(); await download;
  await expect.poll(() => events.some(event => event.event === "template_download")).toBe(true);
  for (const event of events) expect(Object.keys(event).sort()).toEqual(["event", "locale", "resource"]);
  expect(JSON.stringify(events)).not.toContain("private-test");
  expect(JSON.stringify(events)).not.toContain("ROOM-PRIVATE");
});

test("registra llegada al final e intención de crear sin registrar datos de sala", async ({ page }) => {
  const events: Record<string, string>[] = [];
  await page.route("**/api/resource-usage", async route => { events.push(route.request().postDataJSON()); await route.fulfill({ status: 204 }); });
  await page.route("**/pagead2.googlesyndication.com/**", route => route.fulfill({ body: "" }));
  await page.goto("/en/recursos/sesiones-remotas");
  await page.locator("[data-guide-end]").scrollIntoViewIfNeeded();
  await expect.poll(() => events.some(event => event.event === "guide_end_reached" && event.resource === "sesiones-remotas")).toBe(true);
  await page.locator(".resource-header .resource-start").click();
  await expect.poll(() => events.some(event => event.event === "room_create_intent" && event.locale === "en")).toBe(true);
});

test("no envía métricas con Do Not Track", async ({ page }) => {
  const events: string[] = [];
  await page.addInitScript(() => Object.defineProperty(navigator, "doNotTrack", { get: () => "1" }));
  await page.route("**/api/resource-usage", async route => { events.push(route.request().postData() ?? ""); await route.fulfill({ status: 204 }); });
  await page.goto("/demo");
  await page.getByRole("button", { name: "Estimar 5", exact: true }).click();
  await page.getByRole("button", { name: "Revelar votos", exact: true }).click();
  await expect(page.locator(".demo-results")).toBeVisible();
  expect(events).toEqual([]);
});
