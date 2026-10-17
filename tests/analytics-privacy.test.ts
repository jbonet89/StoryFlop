import { describe, it, expect } from "vitest";
import { sanitizeAnalyticsEvent } from "@/lib/analytics-privacy";

describe("privacidad en los pageviews existentes", () => {
  it("descarta salas, API y referentes privados", () => {
    expect(sanitizeAnalyticsEvent({ type: "pageview", url: "https://storyflop.com/sala/PRIVATE12" })).toBeNull();
    expect(sanitizeAnalyticsEvent({ type: "pageview", url: "https://storyflop.com/api/resource-usage" })).toBeNull();
    expect(sanitizeAnalyticsEvent({ type: "pageview", url: "https://storyflop.com/es" }, "https://storyflop.com/sala/PRIVATE12")).toBeNull();
  });
  it("elimina parámetros y anclas y respeta la oposición", () => {
    const event = { type: "pageview" as const, url: "https://storyflop.com/en/recursos?email=private@example.com#secret" };
    expect(sanitizeAnalyticsEvent(event)?.url).toBe("https://storyflop.com/en/recursos");
    expect(sanitizeAnalyticsEvent(event, "", true)).toBeNull();
  });
});
