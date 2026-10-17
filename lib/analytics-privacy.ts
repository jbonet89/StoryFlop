import type { BeforeSendEvent } from "@vercel/analytics";

export function sanitizeAnalyticsEvent(event: BeforeSendEvent, referrer = "", optedOut = false): BeforeSendEvent | null {
  if (optedOut) return null;
  try {
    const url = new URL(event.url);
    if (url.pathname.startsWith("/sala/") || url.pathname.startsWith("/api/")) return null;
    if (referrer && new URL(referrer).pathname.startsWith("/sala/")) return null;
    url.search = ""; url.hash = "";
    return { ...event, url: url.toString() };
  } catch { return null; }
}
