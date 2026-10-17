import { afterEach, describe, expect, it, vi } from "vitest";
import { resourceEventSchema, resourceFromPath } from "@/lib/resource-events";
import { createUsageHandler, createUsageLimiter } from "@/lib/resource-usage-server";
import { recordResourceUsage } from "@/lib/resource-usage-client";

const event = { event: "resource_view", locale: "en", resource: "index" } as const;
const request = (body: unknown = event, headers: Record<string, string> = {}) => new Request("https://storyflop.com/api/resource-usage", { method: "POST", headers: { origin: "https://storyflop.com", "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
afterEach(() => vi.unstubAllGlobals());

describe("medición de recursos sin datos personales", () => {
  it("restringe los identificadores y el contexto de cada acción", () => {
    expect(resourceEventSchema.safeParse(event).success).toBe(true);
    expect(resourceEventSchema.safeParse({ ...event, roomCode: "PRIVATE12" }).success).toBe(false);
    expect(resourceEventSchema.safeParse({ ...event, resource: "personal-story-title" }).success).toBe(false);
    expect(resourceEventSchema.safeParse({ ...event, event: "demo_completed", resource: "template" }).success).toBe(false);
    expect(resourceEventSchema.safeParse({ ...event, event: "room_created", resource: "home" }).success).toBe(true);
    expect(resourceFromPath("/ru/recursos/interpretar-resultados")).toBe("interpretar-resultados");
    expect(resourceFromPath("/sala/PRIVATE12")).toBeNull();
  });

  it("escribe solo el agregado validado y rechaza origen externo", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const handler = createUsageHandler({ write, allow: () => true });
    expect((await handler(request())).status).toBe(204);
    expect(write).toHaveBeenCalledExactlyOnceWith(event);
    expect((await handler(request(event, { origin: "https://other.example" }))).status).toBe(403);
    expect((await handler(request({ ...event, name: "private content" }))).status).toBe(400);
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("respeta privacidad y no mide previews ni robots conocidos", async () => {
    const write = vi.fn(); const handler = createUsageHandler({ write, allow: () => true });
    for (const headers of [{ dnt: "1" }, { "sec-gpc": "1" }, { "user-agent": "Googlebot" }] as Record<string, string>[]) expect((await handler(request(event, headers))).status).toBe(204);
    expect((await createUsageHandler({ write, allow: () => true, enabled: false })(request())).status).toBe(204);
    expect(write).not.toHaveBeenCalled();
  });

  it("limita tamaño, formato, frecuencia y errores del proveedor", async () => {
    const write = vi.fn(); const handler = createUsageHandler({ write, allow: () => true });
    expect((await handler(request("x".repeat(1100)))).status).toBe(413);
    expect((await handler(request(event, { "Content-Type": "text/plain" }))).status).toBe(415);
    expect((await createUsageHandler({ write, allow: () => false })(request())).status).toBe(429);
    expect((await createUsageHandler({ write: async () => { throw new Error("backend unavailable"); }, allow: () => true })(request())).status).toBe(503);
    expect(write).not.toHaveBeenCalled();
  });

  it("acota memoria y restablece el límite tras su ventana", () => {
    const allow = createUsageLimiter(2, 1000, 1);
    expect(allow("ip-one", 100)).toBe(true);
    expect(allow("ip-one", 101)).toBe(true);
    expect(allow("ip-one", 102)).toBe(false);
    expect(allow("ip-two", 103)).toBe(false);
    expect(allow("ip-two", 1100)).toBe(true);
  });

  it("no envía cookies, texto libre ni eventos con DNT o GPC", () => {
    const fetch = vi.fn().mockResolvedValue(new Response()); vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("navigator", { doNotTrack: "1" }); recordResourceUsage(event);
    vi.stubGlobal("navigator", { globalPrivacyControl: true }); recordResourceUsage(event);
    expect(fetch).not.toHaveBeenCalled();
    vi.stubGlobal("navigator", {}); recordResourceUsage(event);
    expect(fetch).toHaveBeenCalledWith("/api/resource-usage", expect.objectContaining({ credentials: "omit", body: JSON.stringify(event), keepalive: true }));
  });
});
