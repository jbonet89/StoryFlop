import { test, expect } from "@playwright/test";

test("sirve la guía editorial sin JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, locale: "es-ES" });
  const page = await context.newPage();
  await page.goto("/es");
  await expect(page.getByRole("heading", { name: "Planning Poker: del número a una decisión compartida" })).toBeVisible();
  await expect(page.locator("#guia")).toContainText("No convirtáis cada punto en horas");
  await expect(page.getByRole("heading", { name: "Una recuperación de contraseña con sorpresas" })).toBeVisible();
  await context.close();
});

test("descarta el documento publicitario al entrar en una sala", async ({ page }) => {
  await page.route("**/pagead2.googlesyndication.com/**", route => route.fulfill({ contentType: "application/javascript", body: "window.__adRuntime = true;" }));
  await page.goto("/es");
  await expect.poll(() => page.evaluate(() => "__adRuntime" in window)).toBe(true);
  await page.getByRole("button", { name: "Entrar con código" }).click();
  await page.getByLabel("Código de sala").fill("K7M4P9Q2");
  await page.getByRole("button", { name: /Entrar a la sala/ }).click();
  await page.waitForURL("**/sala/K7M4P9Q2");
  expect(await page.evaluate(() => "__adRuntime" in window)).toBe(false);
  await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(0);
});

test("la guía no desborda la pantalla", async ({ page }) => {
  await page.goto("/es");
  await page.locator("#guia").scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test("muestra creación y entrada accesibles", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("heading",{name:/Scrum Poker online/})).toBeVisible(); await expect(page.locator("form").getByRole("button",{name:"Crear sala",exact:true})).toBeVisible(); await page.getByRole("button",{name:"Entrar con código"}).click(); await expect(page.getByLabel("Código de sala")).toBeVisible(); });
test("valida un código ambiguo", async ({ page }) => { await page.goto("/"); await page.getByRole("button",{name:"Entrar con código"}).click(); await page.getByLabel("Código de sala").fill("K7M4O9Q2"); await page.getByRole("button",{name:/Entrar a la sala/}).click(); await expect(page.locator(".form-error")).toContainText("Código de sala no válido"); });
