import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { feedbackSchema } from "@/lib/feedback";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc }) }));
import { POST } from "@/app/api/feedback/route";

const valid = { kind: "idea", title: "Mejorar las cartas", description: "Me gustaría personalizar las cartas de mi equipo.", locale: "es", email: "", name: "", website: "" };
function request(body: unknown = valid, headers: Record<string, string> = {}) {
  return new NextRequest("https://storyflop.com/api/feedback", {
    method: "POST", headers: { origin: "https://storyflop.com", "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-server-secret");
  rpc.mockReset().mockResolvedValue({ error: null });
});
describe("recepción privada de propuestas", () => {
  it("permite propuestas anónimas y normaliza los textos", () => {
    const result = feedbackSchema.parse({ ...valid, title: "  Mi propuesta  " });
    expect(result.title).toBe("Mi propuesta");
    expect(result.email).toBe("");
  });
  it.each([
    { title: "ab" }, { description: "corta" }, { email: "incorrecto" },
    { website: "spam.example" }, { kind: "other" }, { locale: "xx" },
    { title: "a".repeat(121) }, { description: "a".repeat(4001) },
  ])("rechaza datos inválidos %j", patch => {
    expect(feedbackSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
  it("guarda sin compartir la IP y confirma solo tras persistir", async () => {
    const response = await POST(request(valid, { "x-vercel-forwarded-for": "203.0.113.42" }));
    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledWith("submit_feedback", expect.objectContaining({ p_title: valid.title, p_fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(JSON.stringify(rpc.mock.calls)).not.toContain("203.0.113.42");
  });
  it("no acepta envíos de otros sitios", async () => {
    expect((await POST(request(valid, { origin: "https://other.example" }))).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("limita el tamaño real aunque falte Content-Length", async () => {
    expect((await POST(request("a".repeat(24001)))).status).toBe(413);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rechaza JSON inválido y el campo trampa", async () => {
    expect((await POST(request("{"))).status).toBe(400);
    expect((await POST(request({ ...valid, website: "bot" }))).status).toBe(400);
  });
  it("devuelve el límite sin exponer detalles internos", async () => {
    rpc.mockResolvedValue({ error: { message: "FEEDBACK_RATE_LIMITED" } });
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("3600");
  });
  it("no confirma éxito si el backend falla o no está configurado", async () => {
    rpc.mockRejectedValue(new Error("private database detail"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private database detail");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect((await POST(request())).status).toBe(503);
  });
});
