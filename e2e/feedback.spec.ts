import { test, expect } from "@playwright/test";

test("propuestas: valida campos, mantiene texto ante errores y confirma el envío", async ({ page }) => {
  await page.goto("/sobre-storyflop#proponer-mejora");
  await expect(page.getByRole("heading", { name: "¿Una idea para mejorar StoryFlop?" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Conóceme en LinkedIn/ })).toHaveAttribute("href", "https://www.linkedin.com/in/jaumebonetmartin/");
  await page.getByLabel("Título", { exact: true }).fill("Personalizar la baraja");
  await page.getByLabel("Descripción", { exact: true }).fill("Me gustaría elegir una baraja distinta para cada equipo.");
  await page.route("**/api/feedback", route => route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"UNAVAILABLE"}' }));
  await page.getByRole("button", { name: /Enviar mensaje/ }).click();
  await expect(page.getByRole("status")).toContainText("No se ha podido enviar");
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue("Personalizar la baraja");
  await page.unroute("**/api/feedback");
  await page.route("**/api/feedback", async route => {
    expect(route.request().postDataJSON()).toMatchObject({ kind: "idea", email: "", locale: "es" });
    await route.fulfill({ status: 201, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.getByRole("button", { name: /Enviar mensaje/ }).click();
  await expect(page.getByRole("status")).toContainText("Tu mensaje se ha guardado");
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue("");
  await page.getByLabel("¿Qué quieres compartir?").selectOption("problem");
  await expect(page.locator("#feedback-description-hint")).toContainText("pasos para reproducirlo");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("formulario y enlace de acceso conservan el idioma", async ({ page }) => {
  await page.goto("/en/sobre-storyflop");
  await page.getByRole("link", { name: "Suggest an improvement →", exact: true }).click();
  await expect(page).toHaveURL(/#proponer-mejora$/);
  await expect(page.getByLabel("Email (optional)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message →" })).toBeVisible();
});
