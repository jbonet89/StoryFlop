import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

test.skip(process.env.RUN_SUPABASE_E2E !== "1", "Requiere un proyecto Supabase de pruebas con las migraciones aplicadas");

async function joinRoom(browser: Browser, url: string, name: string, expectedMembers = 2) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url);
  await page.getByLabel("Tu nombre").fill(name);
  await page.getByRole("button", { name: "Sentarme en la mesa" }).click();
  await expect(page.locator("[data-player-id]")).toHaveCount(expectedMembers, { timeout: 10_000 });
  return { context, page };
}

async function setMode(page: Page, mode: "Votante" | "Observador") {
  await page.locator(".participation-options").getByRole("button", { name: mode, exact: true }).click();
}

async function expectVotingStatus(pages: Page[], text: string) {
  await Promise.all(pages.map(page => expect(page.locator(".felt-ring").getByText(text, { exact: true })).toBeVisible({ timeout: 10_000 })));
}

async function probeDirectSecurity(page: Page, code: string, targetName: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error("Faltan variables públicas de Supabase para el E2E");
  return page.evaluate(async ({ supabaseUrl, anonKey, code, targetName }) => {
    const authKey = Object.keys(localStorage).find(key => key.startsWith("sb-") && key.endsWith("-auth-token"));
    const stored = authKey ? localStorage.getItem(authKey) : null;
    const accessToken = stored ? JSON.parse(stored).access_token as string | undefined : undefined;
    if (!accessToken) throw new Error("No se encontró la sesión anónima");
    const headers = { apikey: anonKey, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
    const rooms = await (await fetch(`${supabaseUrl}/rest/v1/rooms?code=eq.${code}&select=id`, { headers })).json() as { id: string }[];
    const roomId = rooms[0]?.id;
    const rounds = await (await fetch(`${supabaseUrl}/rest/v1/rounds?room_id=eq.${roomId}&status=eq.voting&select=id`, { headers })).json() as { id: string }[];
    const members = await (await fetch(`${supabaseUrl}/rest/v1/room_members?room_id=eq.${roomId}&display_name=eq.${encodeURIComponent(targetName)}&select=id`, { headers })).json() as { id: string }[];
    const roundId = rounds[0]?.id;
    const targetMemberId = members[0]?.id;
    if (!roomId || !roundId || !targetMemberId) throw new Error("No se pudo resolver la ronda de prueba");

    const cast = await fetch(`${supabaseUrl}/rest/v1/rpc/cast_vote`, {
      method: "POST", headers, body: JSON.stringify({ p_round_id: roundId, p_value: "13" }),
    });
    const patch = await fetch(`${supabaseUrl}/rest/v1/round_participation?round_id=eq.${roundId}&member_id=eq.${targetMemberId}`, {
      method: "PATCH", headers, body: JSON.stringify({ participation_mode: "observer" }),
    });
    return { castStatus: cast.status, castBody: await cast.text(), patchStatus: patch.status, patchBody: await patch.text() };
  }, { supabaseUrl, anonKey, code, targetName });
}

test("sincroniza tres usuarios, posiciones y reacciones sin interacción adicional", async ({ browser, page }) => {
  const contexts: BrowserContext[] = [];
  await page.goto("/");
  await page.getByLabel("Nombre de la sala").fill(`Realtime ${Date.now()}`);
  await page.getByLabel("Tu nombre").fill("Ana");
  await page.locator("form").getByRole("button", { name: "Crear sala" }).click();
  await expect(page).toHaveURL(/\/sala\/[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
  const roomUrl = page.url();

  try {
    const second = await joinRoom(browser, roomUrl, "Berto"); contexts.push(second.context);
    await expect(page.locator("[data-player-id]")).toHaveCount(2, { timeout: 10_000 });
    const twoPositions = await page.locator("[data-player-id]").evaluateAll(elements => elements.map(element => ({ left: getComputedStyle(element).left, top: getComputedStyle(element).top })));
    expect(new Set(twoPositions.map(position => `${position.left}:${position.top}`)).size).toBe(2);

    const thirdContext = await browser.newContext(); contexts.push(thirdContext);
    const thirdPage = await thirdContext.newPage();
    await thirdPage.goto(roomUrl);
    await thirdPage.getByLabel("Tu nombre").fill("Carla");
    await thirdPage.getByRole("button", { name: "Sentarme en la mesa" }).click();
    await Promise.all([page, second.page, thirdPage].map(current => expect(current.locator("[data-player-id]")).toHaveCount(3, { timeout: 10_000 })));

    await page.getByRole("button", { name: /Berto,.*abrir reacciones/ }).click();
    const received = Promise.all([page, second.page, thirdPage].map(current => expect(current.locator('.flying-reaction[data-emoji="💩"]')).toBeVisible({ timeout: 10_000 })));
    await page.getByRole("button", { name: "Enviar 💩 a Berto" }).click();
    await received;
    await Promise.all([page, second.page, thirdPage].map(current => expect(current.getByText("Ana ha lanzado 💩 a Berto", { exact: true })).toBeAttached()));
    await expect(page.locator('.flying-reaction[data-emoji="💩"]')).toHaveCount(0, { timeout: 3_000 });

    await page.setViewportSize({ width: 375, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.locator("[data-player-id] .seat-main").first()).toBeEnabled();
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
});

test("asigna un sufijo cuando dos participantes eligen el mismo nombre", async ({ browser, page }) => {
  const contexts: BrowserContext[] = [];
  await page.goto("/");
  await page.getByLabel("Nombre de la sala").fill(`Nombres ${Date.now()}`);
  await page.getByLabel("Tu nombre").fill("Alex");
  await page.locator("form").getByRole("button", { name: "Crear sala" }).click();
  await expect(page).toHaveURL(/\/sala\/[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);

  try {
    const second = await joinRoom(browser, page.url(), "Alex");
    contexts.push(second.context);
    await Promise.all([
      expect(page.locator('[data-player-id]').filter({ hasText: "Alex 2" })).toHaveCount(1),
      expect(second.page.locator('[data-player-id]').filter({ hasText: "Alex 2" })).toHaveCount(1),
    ]);
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
});

test("sincroniza votantes y observadores, elimina votos y conserva el histórico", async ({ browser, page }) => {
  const contexts: BrowserContext[] = [];
  await page.goto("/");
  await page.getByLabel("Nombre de la sala").fill(`Modos ${Date.now()}`);
  await page.getByLabel("Tu nombre").fill("Host Ana");
  await page.locator("form").getByRole("button", { name: "Crear sala" }).click();
  await expect(page).toHaveURL(/\/sala\/[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
  const roomUrl = page.url();

  try {
    await setMode(page, "Observador");
    const participantA = await joinRoom(browser, roomUrl, "Berto"); contexts.push(participantA.context);
    const participantB = await joinRoom(browser, roomUrl, "Carla", 3); contexts.push(participantB.context);
    const pages = [page, participantA.page, participantB.page];
    await Promise.all(pages.map(current => expect(current.locator('[data-player-id]').filter({ hasText: "Host Ana" })).toContainText("Observador", { timeout: 10_000 })));

    await page.getByRole("button", { name: "Añadir tarea" }).click();
    await page.getByLabel("Título", { exact: true }).fill("Modo por ronda");
    await page.locator(".task-editor").getByRole("button", { name: "Añadir tarea", exact: true }).click();
    await page.getByRole("button", { name: "Votar esta tarea: Modo por ronda", exact: true }).click();
    await expectVotingStatus(pages, "0 de 2 han votado");
    await expect(page.getByText("Estás como observador en esta ronda. Actívate como votante para elegir una carta.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Destapar cartas" })).toBeDisabled();

    await participantA.page.locator(".deck-cards").getByRole("button", { name: "5", exact: true }).click();
    await expectVotingStatus(pages, "1 de 2 han votado");
    await Promise.all([
      participantA.page.waitForEvent("dialog").then(current => current.accept()),
      setMode(participantA.page, "Observador"),
    ]);
    await expectVotingStatus(pages, "0 de 1 han votado");
    await Promise.all(pages.map(current => expect(current.locator('[data-player-id]').filter({ hasText: "Berto" })).toContainText("Observador", { timeout: 10_000 })));

    const roomCode = new URL(roomUrl).pathname.split("/").pop()!;
    expect(roomCode).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
    const security = await probeDirectSecurity(participantA.page, roomCode, "Carla");
    expect(security.castStatus).toBeGreaterThanOrEqual(400);
    expect(security.castBody).toContain("OBSERVER_CANNOT_VOTE");
    expect(security.patchStatus).toBeGreaterThanOrEqual(400);

    await participantB.page.locator(".deck-cards").getByRole("button", { name: "8", exact: true }).click();
    await expectVotingStatus(pages, "1 de 1 han votado");
    await page.getByRole("button", { name: "Destapar cartas" }).click();
    await Promise.all(pages.map(current => expect(current.getByText("Cartas reveladas", { exact: true })).toBeVisible({ timeout: 10_000 })));
    await expect(page.locator(".stat-grid").getByText("1", { exact: true })).toBeVisible();

    await setMode(participantA.page, "Votante");
    await page.getByRole("button", { name: "Nueva ronda" }).click();
    await expectVotingStatus(pages, "0 de 2 han votado");

    await participantA.page.locator(".deck-cards").getByRole("button", { name: "5", exact: true }).click();
    await participantB.page.locator(".deck-cards").getByRole("button", { name: "8", exact: true }).click();
    await expectVotingStatus(pages, "2 de 2 han votado");
    await page.getByRole("button", { name: "Destapar cartas" }).click();
    await page.locator(".history").getByText(/Historial de rondas/).click();
    const firstRound = page.locator(".history-rounds article").filter({ hasText: "Ronda 1" });
    await expect(firstRound).toContainText("Berto");
    await expect(firstRound).toContainText("Observador");

    await setMode(participantA.page, "Observador");
    await setMode(participantB.page, "Observador");
    await page.getByRole("button", { name: "Nueva ronda" }).click();
    await expectVotingStatus(pages, "No hay votantes en esta ronda");
    await expect(page.getByRole("button", { name: "Destapar cartas" })).toBeDisabled();
    await setMode(participantB.page, "Votante");
    await expectVotingStatus(pages, "0 de 1 han votado");
  } finally {
    await Promise.all(contexts.map(context => context.close()));
  }
});
