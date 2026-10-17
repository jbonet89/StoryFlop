"use client";
import { resourceEventSchema, type ResourceEvent } from "@/lib/resource-events";

export function recordResourceUsage(event: ResourceEvent): void {
  const browser = typeof navigator === "undefined" ? undefined : navigator as Navigator & { globalPrivacyControl?: boolean };
  if (!browser || browser.doNotTrack === "1" || browser.globalPrivacyControl) return;
  if (!resourceEventSchema.safeParse(event).success) return;
  // Only fixed event, language and resource identifiers are sent. No cookies or user content.
  void fetch("/api/resource-usage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(event), credentials: "omit", keepalive: true }).catch(() => {});
}
