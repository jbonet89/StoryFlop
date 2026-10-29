import { test, expect } from "@playwright/test";
const mock = `if(typeof atOptions !== 'undefined'){var ad=document.createElement('iframe');ad.width=atOptions.width;ad.height=atOptions.height;ad.srcdoc='<p>Test advertisement</p>';document.currentScript.parentElement.appendChild(ad);}else{document.getElementById('container-973a91795cf468905d9b39cff1f465ba').innerHTML='<a href="https://example.com" style="display:block;height:180px">Test advertisement</a>';}`;

test("no solicita anuncios antes de elegir ni después de rechazar", async ({ page }) => {
  const requests: string[] = [];
  await page.route("**/__adsterra-test/*.js", route => { requests.push(route.request().url()); return route.fulfill({ contentType: "application/javascript", body: mock }); });
  await page.goto("/es"); await expect(page.getByRole("button", { name: "Aceptar publicidad", exact: true })).toBeVisible();
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "Rechazar", exact: true }).click();
  await page.locator("#preguntas").scrollIntoViewIfNeeded();
  expect(requests).toEqual([]); await expect(page.locator(".adsterra-ad")).toHaveCount(0);
  expect(await page.locator(".adsterra-host").evaluateAll(elements => elements.every(el => el.getBoundingClientRect().height === 0))).toBe(true);
  await page.reload(); await expect(page.getByRole("button", { name: "Aceptar publicidad", exact: true })).toHaveCount(0);
});

test("carga etiquetas directas del tamaño correcto y permite retirar el consentimiento", async ({ page }) => {
  const requests: string[] = [];
  await page.route("**/__adsterra-test/*.js", route => { requests.push(route.request().url()); return route.fulfill({ contentType: "application/javascript", body: mock }); });
  await page.goto("/es"); await page.getByRole("button", { name: "Aceptar publicidad", exact: true }).click();
  await page.locator(".adsterra-host").first().scrollIntoViewIfNeeded();
  const desktop = page.viewportSize()!.width >= 800;
  const unit = page.locator(`[data-ad-format="${desktop ? "leaderboard" : "mobile"}"]`);
  await expect(unit).toBeVisible();
  await expect.poll(() => requests.some(url => url.includes(desktop ? "leaderboard.js" : "mobile.js"))).toBe(true);
  const script = unit.locator(".adsterra-content > script"); await expect(script).toHaveCount(1);
  expect(await script.evaluate(el => el.ownerDocument.defaultView === window)).toBe(true);
  expect(await script.evaluate(el => el.closest("iframe"))).toBeNull();
  await page.locator("#preguntas").scrollIntoViewIfNeeded();
  if (desktop) { await expect(page.locator('[data-ad-format="native"]')).toBeVisible(); await expect.poll(() => requests.some(url => url.includes("native.js"))).toBe(true); }
  else expect(requests.some(url => url.includes("native.js"))).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#privacy-settings").click(); const navigation = page.waitForEvent("domcontentloaded");
  await page.getByRole("button", { name: "Rechazar", exact: true }).click(); await navigation;
  await expect(page.locator(".adsterra-ad")).toHaveCount(0);
  expect(await page.evaluate(() => "atOptions" in window)).toBe(false);
  await page.goto("/recursos"); await expect(page.locator(".adsterra-ad")).toHaveCount(0);
  await expect(page.locator('script[src*="bauval.org"]')).toHaveCount(0);
});

test("oculta el hueco cuando falla el proveedor", async ({ page }) => {
  let attempted = 0;
  await page.route("**/__adsterra-test/*.js", route => { attempted++; return route.abort(); });
  await page.goto("/es"); await page.getByRole("button", { name: "Aceptar publicidad", exact: true }).click();
  await page.locator(".adsterra-host").first().scrollIntoViewIfNeeded();
  await expect.poll(() => attempted).toBeGreaterThan(0);
  await expect(page.locator(".adsterra-ad")).toHaveCount(0, { timeout: 15000 });
});
