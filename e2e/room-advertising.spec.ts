import { test, expect, type Page } from "@playwright/test";
const mockBanner = `var ad=document.createElement('iframe');ad.width=atOptions.width;ad.height=atOptions.height;ad.srcdoc='<p>Test advertisement</p>';document.currentScript.parentElement.appendChild(ad);`;
async function mockAccess(page: Page, pauseRoom = false) {
  let releaseRoom: () => void = () => {};
  const held = new Promise<void>(resolve => { releaseRoom = resolve; });
  const now = new Date().toISOString(); let joined = false; let requests = 0;
  const user = { id: "user-test", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, identities: [], created_at: now, is_anonymous: true };
  const token = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now()/1000)+3600 })).toString("base64url")}.test`;
  const room = { id: "room-test", code: "ABCDEFGH", name: "Test room", status: "open", owner_user_id: user.id, deck: ["1","3","5"], created_at: now, updated_at: now, last_activity_at: now };
  const member = { id: "member-test", room_id: room.id, user_id: user.id, display_name: "Ana", avatar_key: "🦊", role: "host", default_participation_mode: "voter", joined_at: now, is_kicked: false };
  await page.route("**/auth/v1/**", route => route.fulfill({ json: route.request().url().includes("/user") ? user : { access_token: token, refresh_token: "test-refresh", token_type: "bearer", expires_in: 3600, user } }));
  await page.route("**/rest/v1/**", async route => {
    const table = new URL(route.request().url()).pathname.split("/rest/v1/")[1];
    if (table === "rooms" && pauseRoom) await held;
    if (table === "rpc/join_room") { joined = true; return route.fulfill({ json: { room_id: room.id } }); }
    return route.fulfill({ json: table === "rooms" ? room : table === "room_members" ? (joined ? [member] : []) : [] });
  });
  await page.routeWebSocket("**/realtime/**", () => {});
  await page.route("**/__adsterra-test/*.js", route => { requests++; return route.fulfill({ contentType: "application/javascript", body: mockBanner }); });
  return { releaseRoom, get joined() { return joined; }, get requests() { return requests; } };
}

test("el acceso directo solicita consentimiento y permite entrar al rechazar sin esperar", async ({ page }) => {
  const state = await mockAccess(page); await page.goto("/sala/ABCDEFGH");
  await expect(page.getByLabel("Tu nombre")).toBeVisible();
  await expect(page.getByRole("button", { name: "Aceptar publicidad", exact: true })).toBeVisible();
  expect(state.requests).toBe(0);
  await page.getByRole("button", { name: "Rechazar", exact: true }).click();
  await page.getByLabel("Tu nombre").fill("Ana");
  await page.locator(".join-card .primary-button").click();
  await expect(page.locator(".room-app")).toBeVisible();
  expect(state.joined).toBe(true); expect(state.requests).toBe(0);
  await expect(page.locator(".adsterra-ad")).toHaveCount(0);
});

test("el 300x250 está solo junto al formulario y su runtime se descarta al acceder", async ({ page }) => {
  const state = await mockAccess(page); await page.goto("/sala/ABCDEFGH");
  await page.getByRole("button", { name: "Aceptar publicidad", exact: true }).click();
  await page.locator(".adsterra-host").scrollIntoViewIfNeeded();
  await expect(page.locator('[data-ad-format="rectangle"] iframe')).toBeVisible();
  await expect.poll(() => state.requests).toBe(1);
  const options = await page.evaluate(() => (window as unknown as { atOptions: { width: number; height: number; key: string } }).atOptions);
  expect(options).toMatchObject({ width: 300, height: 250, key: "0082de9655db330634ceb0623b845da8" });
  await page.getByLabel("Tu nombre").fill("Ana"); await page.locator(".join-card .primary-button").click();
  await expect(page.locator(".room-app")).toBeVisible();
  await expect(page.locator(".adsterra-ad")).toHaveCount(0);
  expect(await page.evaluate(() => "atOptions" in window)).toBe(false);
  expect(state.requests).toBe(1);
});


test("no muestra publicidad ni consentimiento publicitario mientras prepara o restaura la mesa", async ({ page }) => {
  const state = await mockAccess(page, true); await page.goto("/sala/ABCDEFGH");
  await expect(page.locator(".state-card .spin")).toBeVisible();
  await expect(page.locator(".adsterra-ad")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Aceptar publicidad", exact: true })).toHaveCount(0);
  expect(state.requests).toBe(0);
  state.releaseRoom(); await expect(page.getByLabel("Tu nombre")).toBeVisible();
  await expect(page.getByRole("button", { name: "Aceptar publicidad", exact: true })).toBeVisible();
});
