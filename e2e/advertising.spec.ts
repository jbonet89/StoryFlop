import { test, expect } from "@playwright/test";
const mock = `if(typeof atOptions !== 'undefined'){var ad=document.createElement('iframe');ad.width=atOptions.width;ad.height=atOptions.height;ad.srcdoc='<p>Test advertisement</p>';document.body.appendChild(ad);}else{document.getElementById('container-973a91795cf468905d9b39cff1f465ba').innerHTML='<a href="https://example.com" style="display:block;height:180px">Test advertisement</a>';}`;

test("no solicita anuncios antes de elegir ni después de rechazar", async ({ page }) => {
  const requests: string[] = [];
  await page.route("https://bauval.org/**", route => { requests.push(route.request().url()); return route.fulfill({ contentType: "application/javascript", body: mock }); });
  await page.goto("/es"); await expect(page.getByRole("button", { name: "Aceptar publicidad", exact: true })).toBeVisible();
  expect(requests).toEqual([]);
  await page.getByRole("button", { name: "Rechazar", exact: true }).click();
  await page.locator("#preguntas").scrollIntoViewIfNeeded();
  expect(requests).toEqual([]); await expect(page.locator(".adsterra-ad")).toHaveCount(0);
  expect(await page.locator(".adsterra-host").evaluateAll(elements => elements.every(el => el.getBoundingClientRect().height === 0))).toBe(true);
  await page.reload(); await expect(page.getByRole("button", { name: "Aceptar publicidad", exact: true })).toHaveCount(0);
});

test("carga el tamaño que cabe, aísla scripts y permite retirar el consentimiento", async ({ page }) => {
  const requests: string[] = [];
  await page.route("https://bauval.org/**", route => { requests.push(route.request().url()); return route.fulfill({ contentType: "application/javascript", body: mock }); });
  await page.goto("/es"); await page.getByRole("button", { name: "Aceptar publicidad", exact: true }).click();
  await page.locator(".adsterra-host").first().scrollIntoViewIfNeeded();
  const desktop = page.viewportSize()!.width >= 800;
  const unit = page.locator(`[data-ad-format="${desktop ? "leaderboard" : "mobile"}"]`);
  await expect(unit).toBeVisible();
  await expect.poll(() => requests.some(url => url.includes(desktop ? "31210775" : "2cef96db"))).toBe(true);
  const frame = unit.locator(":scope > iframe"); await expect(frame).toHaveAttribute("sandbox", "allow-scripts allow-popups allow-popups-to-escape-sandbox");
  const frameContext = page.frames().find(f => f.url() === "about:srcdoc")!;
  expect(await frameContext.evaluate(() => { try { void parent.document.body; return false; } catch { return true; } })).toBe(true);
  await page.locator("#preguntas").scrollIntoViewIfNeeded();
  if (desktop) { await expect(page.locator('[data-ad-format="native"]')).toBeVisible(); await expect.poll(() => requests.some(url => url.includes("973a9179"))).toBe(true); }
  else expect(requests.some(url => url.includes("973a9179"))).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#privacy-settings").click(); await page.getByRole("button", { name: "Rechazar", exact: true }).click();
  await expect(page.locator(".adsterra-ad")).toHaveCount(0);
  await page.goto("/recursos"); await expect(page.locator(".adsterra-ad")).toHaveCount(0);
  await expect(page.locator('script[src*="bauval.org"]')).toHaveCount(0);
});

test("oculta el hueco cuando falla el proveedor", async ({ page }) => {
  let attempted = 0;
  await page.route("https://bauval.org/**", route => { attempted++; return route.abort(); });
  await page.goto("/es"); await page.getByRole("button", { name: "Aceptar publicidad", exact: true }).click();
  await page.locator(".adsterra-host").first().scrollIntoViewIfNeeded();
  await expect.poll(() => attempted).toBeGreaterThan(0);
  await expect(page.locator(".adsterra-ad")).toHaveCount(0, { timeout: 15000 });
});
