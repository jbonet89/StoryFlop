"use client";
import { Analytics } from "@vercel/analytics/next";
import { sanitizeAnalyticsEvent } from "@/lib/analytics-privacy";

export function PrivacyAnalytics() {
  return <Analytics beforeSend={event => {
    const browser = navigator as Navigator & { globalPrivacyControl?: boolean };
    return sanitizeAnalyticsEvent(event, document.referrer, browser.doNotTrack === "1" || browser.globalPrivacyControl === true);
  }} />;
}
