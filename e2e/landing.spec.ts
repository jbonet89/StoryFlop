import { test, expect } from "@playwright/test";

test("la portada permite probar una ronda y publica un título sin duplicar", async ({ page }) => {
  await page.goto("/es");
  await expect(page).toHaveTitle("Scrum Poker online gratis para equipos ágiles | StoryFlop");
  const demo = page.locator(".landing-demo");
  await demo.getByRole("button", { name: "Estimar 5", exact: true }).click();
  await demo.getByRole("button", { name: "Revelar votos", exact: true }).click();
  await expect(demo.locator(".demo-discussion")).toBeVisible();
  await demo.getByRole("button", { name: /Aclarar el alcance y repetir/ }).click();
  await demo.getByRole("button", { name: "Estimar 5", exact: true }).click();
  await demo.getByRole("button", { name: "Revelar segunda ronda", exact: true }).click();
  await expect(demo.getByRole("heading", { name: "Hay coincidencia; falta documentar el acuerdo" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("sirve la guía editorial sin JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, locale: "es-ES" });
  const page = await context.newPage();
  await page.goto("/es");
  await expect(page.getByRole("heading", { name: "Planning Poker: del número a una decisión compartida" })).toBeVisible();
  await expect(page.locator("#guia")).toContainText("No convirtáis cada punto en horas");
  await expect(page.getByRole("heading", { name: "Una recuperación de contraseña con sorpresas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Una breve historia del Planning Poker" })).toBeVisible();
  await expect(page.getByRole("link", { name: "James Grenning", exact: true })).toHaveAttribute("href", /agilealliance\.org/);
  await expect(page.getByRole("link", { name: "Mike Cohn", exact: true })).toHaveAttribute("href", /wikipedia\.org/);
  await context.close();
});

test("descarta el documento publicitario al entrar en una sala", async ({ page }) => {
  await page.route("**/pagead2.googlesyndication.com/**", route => route.fulfill({ contentType: "application/javascript", body: "window.__adRuntime = true;" }));
  await page.goto("/es");
  await page.evaluate(() => { Object.assign(window, { __adRuntime: true }); });
  await page.getByRole("button", { name: "Entrar con código" }).click();
  await page.getByLabel("Código de sala").fill("K7M4P9Q2");
  await page.getByRole("button", { name: /Entrar a la sala/ }).click();
  await page.waitForURL("**/sala/K7M4P9Q2");
  expect(await page.evaluate(() => "__adRuntime" in window)).toBe(false);
  await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(0);
});

test("no carga publicidad sin consentimiento ni dentro del formulario", async ({ page }) => {
  await page.goto("/es");
  await expect(page.locator(".adsterra-ad")).toHaveCount(0);
  await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(0);
  await expect(page.locator(".landing-grid iframe")).toHaveCount(0);
});

test("la guía no desborda la pantalla", async ({ page }) => {
  await page.goto("/es");
  await page.locator("#guia").scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test("muestra creación y entrada accesibles", async ({ page }) => { await page.goto("/"); await expect(page.getByRole("heading",{name:/Scrum Poker online/})).toBeVisible(); await expect(page.locator("form").getByRole("button",{name:"Crear sala",exact:true})).toBeVisible(); await page.getByRole("button",{name:"Entrar con código"}).click(); await expect(page.getByLabel("Código de sala")).toBeVisible(); });
test("valida un código ambiguo", async ({ page }) => { await page.goto("/"); await page.getByRole("button",{name:"Entrar con código"}).click(); await page.getByLabel("Código de sala").fill("K7M4O9Q2"); await page.getByRole("button",{name:/Entrar a la sala/}).click(); await expect(page.locator(".form-error")).toContainText("Código de sala no válido"); });
