import { expect, test, type Page } from "@playwright/test";

// All Auth, REST and WebSocket traffic is intercepted: no production writes.
async function mockRoom(page: Page, realtime = false) {
  const now = new Date().toISOString();
  const room = { id: "room-test", code: "ABCDEFGH", name: "Recovery test", status: "open", owner_user_id: "user-a", deck: ["1", "3", "5", "8"], created_at: now, updated_at: now, last_activity_at: now };
  const members = ["a", "b", "c"].map((id, index) => ({ id, room_id: room.id, user_id: `user-${id}`, display_name: ["Ana", "Berto", "GlamingObserver"][index], avatar_key: "🦩", role: index ? "participant" : "host", default_participation_mode: index === 2 ? "observer" : "voter", joined_at: now, is_kicked: false }));
  const task = { id: "task-test", room_id: room.id, title: "Test story", description: null, task_url: null, status: "voting", sort_order: 1, created_at: now, updated_at: now };
  const round = { id: "round-test", room_id: room.id, task_id: task.id, status: "voting", round_number: 1, created_at: now, revealed_at: null };
  const participations = members.map(member => ({ room_id: room.id, round_id: round.id, member_id: member.id, participation_mode: member.default_participation_mode, has_voted: member.id !== "c", voted_at: now, created_at: now, updated_at: now }));
  const votes = members.slice(0, 2).map(member => ({ id: `vote-${member.id}`, room_id: room.id, round_id: round.id, member_id: member.id, value: "5", created_at: now, updated_at: now }));
  const user = { id: "user-a", aud: "authenticated", role: "authenticated", email: "", app_metadata: {}, user_metadata: {}, identities: [], created_at: now, is_anonymous: true };
  const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test`;
  await page.route("**/auth/v1/**", route => route.fulfill({ json: route.request().url().includes("/user") ? user : { access_token: token, refresh_token: "test-refresh", token_type: "bearer", expires_in: 3600, user } }));
  await page.route("**/rest/v1/**", route => {
    const path = new URL(route.request().url()).pathname.split("/rest/v1/")[1];
    if (path === "rpc/reveal_round") { round.status = "revealed"; task.status = "revealed"; }
    const tables: Record<string, unknown> = { rooms: room, room_members: members.filter(member => !member.is_kicked), tasks: [task], rounds: [round], round_participation: participations, votes: round.status === "revealed" ? votes : votes.slice(0, 1), task_estimate_changes: [] };
    return route.fulfill({ json: tables[path] ?? null });
  });
  let tracks = 0;
  let setPresence: (ids: string[]) => void = () => {};
  let emitParticipation: (record: typeof participations[number]) => void = () => {};
  await page.routeWebSocket("**/realtime/**", socket => {
    socket.onMessage(message => {
      if (!realtime || typeof message !== "string") return;
      const [joinRef, ref, topic, event, payload] = JSON.parse(message);
      const send = (event: string, payload: unknown, responseRef: string | null = null) => socket.send(JSON.stringify([joinRef, responseRef, topic, event, payload]));
      if (event === "phx_join") {
        const changes = (payload.config?.postgres_changes ?? []).map((change: object, id: number) => ({ ...change, id }));
        send("phx_reply", { status: "ok", response: { postgres_changes: changes } }, ref);
        if (topic.includes("presence:")) {
          setPresence = ids => send("presence_state", Object.fromEntries(ids.map(id => [id, { metas: [{ phx_ref: `ref-${id}`, member_id: id }] }])));
          setPresence(["a", "b", "c"]);
        }
        if (topic.includes("room-data:")) emitParticipation = record => send("postgres_changes", { ids: [3], data: { schema: "public", table: "round_participation", type: "UPDATE", record, old_record: {}, columns: [], commit_timestamp: now } });
      } else if (event === "presence") {
        tracks++;
        send("phx_reply", { status: "ok", response: {} }, ref);
      } else if (event === "heartbeat" || event === "phx_leave") send("phx_reply", { status: "ok", response: {} }, ref);
    });
  });
  await page.goto("/sala/ABCDEFGH");
  await expect(page.locator("[data-player-id]")).toHaveCount(3);
  return { members, participations, votes, round, get tracks() { return tracks; }, setPresence: (ids: string[]) => setPresence(ids), emitParticipation: (record: typeof participations[number]) => emitParticipation(record) };
}

async function resume(page: Page, event = "pageshow") {
  await page.evaluate(event => window.dispatchEvent(new Event(event)), event);
}

async function reveal(page: Page) {
  const backlog = page.getByRole("button", { name: "Abrir backlog" });
  if (await backlog.isVisible()) await backlog.click();
  await page.locator(".reveal-button").click();
}

test("observer keeps only the pill and frees the name area", async ({ page }) => {
  await mockRoom(page);
  const observer = page.locator('[data-player-id="c"]');
  await expect(observer.locator(".observer-card")).toHaveCount(0);
  await expect(observer.locator(".participation-badge.observer")).toHaveCount(1);
  await expect(observer.locator(".player-meta strong")).toHaveText("GlamingObserver");
});

for (const event of ["pageshow", "focus", "online", "visibilitychange", "poll"]) {
  test(`recovers missed participant changes via ${event}`, async ({ page }) => {
    const state = await mockRoom(page);
    state.members[1].display_name = "Berto actualizado";
    state.members[1].default_participation_mode = "observer";
    state.participations[1].participation_mode = "observer";
    state.participations[1].has_voted = false;
    if (event === "visibilitychange") await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    else if (event !== "poll") await resume(page, event);
    await expect(page.locator('[data-player-id="b"]')).toHaveAttribute("data-participation-mode", "observer", { timeout: 22_000 });
    await expect(page.locator('[data-player-id="b"] .player-meta strong')).toHaveText("Berto actualizado");
    state.members[1].is_kicked = true;
    await resume(page);
    await expect(page.locator("[data-player-id]")).toHaveCount(2);
  });
}

test("celebrates unanimous reveal once, then clears and does not replay on reload", async ({ page }) => {
  await mockRoom(page);
  await expect(page.locator(".consensus-confetti.is-firing")).toHaveCount(0);
  await reveal(page);
  await expect(page.locator(".consensus-confetti.is-firing")).toHaveCount(1);
  if (test.info().project.name === "webkit") {
    await expect.poll(() => page.locator(".consensus-confetti i").first().evaluate(element => Number(getComputedStyle(element).opacity))).toBeGreaterThan(0);
    await page.screenshot({ path: "outputs/consensus-webkit.png" });
  }
  await expect(page.locator(".consensus-confetti.is-firing")).toHaveCount(0, { timeout: 4000 });
  await resume(page);
  await expect(page.locator(".consensus-confetti.is-firing")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".round-results")).toBeVisible();
  await expect(page.locator(".consensus-confetti.is-firing")).toHaveCount(0);
});

for (const scenario of ["different", "pending", "reduced-motion"]) {
  test(`does not celebrate ${scenario}`, async ({ page }) => {
    const state = await mockRoom(page);
    if (scenario === "different") state.votes[1].value = "8";
    if (scenario === "pending") state.participations[1].has_voted = false;
    if (scenario === "reduced-motion") await page.emulateMedia({ reducedMotion: "reduce" });
    await reveal(page);
    await expect(page.locator(".round-results")).toBeVisible();
    await expect(page.locator(".consensus-confetti.is-firing")).toHaveCount(0);
  });
}

test("presence syncs leave/rejoin and reannounces after resume; votes update over WebSocket", async ({ page }) => {
  const state = await mockRoom(page, true);
  const connected = page.locator('[data-player-id="b"] .player-avatar i');
  await expect(connected).toHaveClass("online");
  await expect.poll(() => state.tracks).toBeGreaterThan(0);
  state.setPresence(["a", "c"]);
  await expect(connected).toHaveClass("offline");
  state.setPresence(["a", "b", "c"]);
  await expect(connected).toHaveClass("online");
  const before = state.tracks;
  await resume(page);
  await expect.poll(() => state.tracks).toBeGreaterThan(before);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(connected).toHaveClass("offline");
  await resume(page, "online");
  await expect.poll(() => state.tracks).toBeGreaterThan(before + 1);
  state.setPresence(["a", "b", "c"]);
  await expect(connected).toHaveClass("online");
  state.emitParticipation({ ...state.participations[1], has_voted: false });
  await expect(page.locator('[data-player-id="b"] .vote-card')).toHaveCount(0);
  state.emitParticipation({ ...state.participations[1], has_voted: true });
  await expect(page.locator('[data-player-id="b"] .vote-card')).toHaveCount(1);
});
