import { createHash, randomBytes } from "node:crypto";
import { resourceEventSchema, type ResourceEvent } from "@/lib/resource-events";

export function createUsageLimiter(limit = 60, windowMs = 60_000, maxKeys = 2000) {
  const salt = randomBytes(16).toString("hex");
  const buckets = new Map<string, { started: number; count: number }>();
  return (ip: string, now = Date.now()) => {
    for (const [key, bucket] of buckets) if (now - bucket.started >= windowMs) buckets.delete(key);
    const key = createHash("sha256").update(salt).update(ip).digest("hex");
    let bucket = buckets.get(key);
    if (!bucket) {
      if (buckets.size >= maxKeys) return false;
      bucket = { started: now, count: 0 }; buckets.set(key, bucket);
    }
    return ++bucket.count <= limit;
  };
}
async function readSmallJson(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1024) { await reader.cancel(); throw new Error("TOO_LARGE"); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export function createUsageHandler({ write, allow, enabled = true }: { write: (event: ResourceEvent) => Promise<void>; allow: (ip: string) => boolean; enabled?: boolean }) {
  return async (request: Request) => {
    const empty = (status = 204) => new Response(null, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
    if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") return empty(403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) return empty(415);
    let body: unknown;
    try { body = await readSmallJson(request); } catch (error) { return empty(error instanceof Error && error.message === "TOO_LARGE" ? 413 : 400); }
    const parsed = resourceEventSchema.safeParse(body);
    if (!parsed.success) return empty(400);
    if (!enabled || request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1" || /bot|crawler|spider|HeadlessChrome/i.test(request.headers.get("user-agent") ?? "")) return empty();
    if (!allow((request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim())) return empty(429);
    try { await write(parsed.data); return empty(); }
    catch { return empty(503); }
  };
}
