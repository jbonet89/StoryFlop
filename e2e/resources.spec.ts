import { test, expect } from "@playwright/test";

test("recorre la demo y conserva un voto discrepante sin crear una sala", async ({ page }) => {
  const backendCalls: string[] = [];
  page.on("request", request => { if (request.url().includes("supabase")) backendCalls.push(request.url()); });
  await page.goto("/demo");
  await expect(page.getByRole("button", { name: "Revelar votos", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Estimar 8", exact: true }).click();
  await page.getByRole("button", { name: "Revelar votos", exact: true }).click();
  await expect(page.getByLabel("Ana: 3", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Cris: 13", { exact: true })).toBeVisible();
  await expect(page.locator(".demo-results")).toContainText("7,25");
  await page.getByRole("button", { name: "Aclarar el alcance y repetir" }).click();
  await expect(page.getByRole("button", { name: "Revelar segunda ronda" })).toBeDisabled();
  await page.getByRole("button", { name: "Tengo dudas" }).click();
  await page.getByRole("button", { name: "Revelar segunda ronda" }).click();
  await expect(page.getByRole("heading", { name: "Tu carta pide detenerse y conversar" })).toBeVisible();
  await expect(page.locator(".demo-results dl")).toContainText("No");
  await page.getByRole("button", { name: "Reiniciar demo" }).click();
  await expect(page.getByRole("button", { name: "Revelar votos", exact: true })).toBeDisabled();
  expect(backendCalls).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("descarga el contenido editado e imprime solo la ficha", async ({ page }) => {
  await page.goto("/recursos/plantilla-refinamiento");
  await page.getByLabel("Plantilla de la sesión").fill("Sesión de prueba\nHistoria: acceso por correo");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar .txt" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("storyflop-plantilla-refinamiento.txt");
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream!) chunks.push(chunk);
  expect(Buffer.concat(chunks).toString("utf8")).toBe("Sesión de prueba\nHistoria: acceso por correo");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".template-print")).toBeVisible();
  await expect(page.locator(".template-print")).toContainText("Historia: acceso por correo");
  await expect(page.locator(".resource-header")).toBeHidden();
  await expect(page.locator(".template-example")).toBeHidden();
});

test("sirve todos los recursos y la ficha sin JavaScript con idioma y canónica propios", async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, locale: "en-US" });
  const page = await context.newPage();
  const paths = ["/recursos", "/recursos/primera-sesion", "/recursos/resolver-desacuerdos", "/recursos/historias-listas-para-estimar", "/recursos/plantilla-refinamiento", "/sobre-storyflop", "/demo"];
  for (const path of paths) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://storyflop.com${path}`);
    await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto("/recursos/plantilla-refinamiento");
  await expect(page.getByLabel("Plantilla de la sesión")).toContainText("Criterios de aceptación");
  await page.goto("/recursos/guia-inexistente");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  const sitemap = await request.get("/sitemap.xml");
  const xml = await sitemap.text();
  for (const path of paths) expect(xml).toContain(`https://storyflop.com${path}<`);
  await context.close();
});

test("descarta el runtime publicitario al abrir los recursos desde la portada", async ({ page }) => {
  await page.route("**/pagead2.googlesyndication.com/**", route => route.fulfill({ contentType: "application/javascript", body: "window.__adRuntime = true;" }));
  await page.goto("/es");
  if (process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true") {
    await expect.poll(() => page.evaluate(() => "__adRuntime" in window)).toBe(true);
  } else {
    await page.evaluate(() => { Object.assign(window, { __adRuntime: true }); });
  }
  await page.getByRole("link", { name: /Explorar las guías/ }).click();
  await expect(page).toHaveURL(/\/recursos$/);
  expect(await page.evaluate(() => "__adRuntime" in window)).toBe(false);
  await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(0);
});
