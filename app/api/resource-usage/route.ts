import { createUsageHandler, createUsageLimiter } from "@/lib/resource-usage-server";
import type { ResourceEvent } from "@/lib/resource-events";

export const runtime = "nodejs";
const allow = createUsageLimiter();
async function write(event: ResourceEvent) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) throw new Error("METRICS_NOT_CONFIGURED");
  const response = await fetch(`${url}/rest/v1/rpc/record_resource_usage`, {
    method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_event: event.event, p_locale: event.locale, p_resource: event.resource }),
    signal: AbortSignal.timeout(4000), cache: "no-store",
  });
  if (!response.ok) throw new Error("METRICS_UNAVAILABLE");
}
export async function POST(request: Request) {
  const enabled = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview" && !["localhost", "127.0.0.1"].includes(new URL(request.url).hostname);
  return createUsageHandler({ write, allow, enabled })(request);
}
