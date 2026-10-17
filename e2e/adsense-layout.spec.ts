import { test, expect } from "@playwright/test";

const enabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
test("sin anuncios no reserva espacios; solo abre la columna FAQ si hay creatividad", async ({ page }) => {
  await page.route("**/pagead2.googlesyndication.com/**", route => route.fulfill({ contentType: "application/javascript", body: "" }));
  await page.goto("/es");
  const faq = page.locator(".faq-with-ad");
  const columns = () => faq.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(await columns()).toBe(1);
  await expect(page.locator(".ad-placement")).toHaveCount(enabled ? 4 : 0);
  if (!enabled) {
    await expect(page.locator('script[src*="adsbygoogle.js"]')).toHaveCount(0);
    await expect(page.locator('meta[name="google-adsense-account"]')).toHaveAttribute("content", "ca-pub-2657741160026304");
    return;
  }
  // Simulates Google's final states; no live ads or clicks in this test.
  await page.locator(".adsbygoogle").evaluateAll(units => units.forEach(unit => {
    (unit as HTMLElement).style.height = "250px";
    unit.setAttribute("data-ad-status", "unfilled");
  }));
  for (const unit of await page.locator(".ad-placement").all()) await expect(unit).toBeHidden();
  expect(await columns()).toBe(1);
  await page.locator(".ad-multiplex ins").evaluate(unit => unit.setAttribute("data-ad-status", "filled"));
  await expect(page.locator(".ad-multiplex")).toBeVisible();
  expect(await columns()).toBe(page.viewportSize()!.width > 600 ? 2 : 1);
  await page.locator(".ad-multiplex ins").evaluate(unit => unit.setAttribute("data-ad-status", "unfilled"));
  await expect(page.locator(".ad-multiplex")).toBeHidden();
  expect(await columns()).toBe(1);
  await page.locator(".ad-multiplex ins").evaluate(unit => unit.setAttribute("data-ad-status", "unfill-optimized"));
  await expect(page.locator(".ad-multiplex")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
