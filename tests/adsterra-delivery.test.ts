import { describe, expect, it } from "vitest";
import { adsterraDelivery } from "@/lib/adsterra";
describe("publisher traffic boundaries", () => {
  it("does not request advertising on unapproved hosts or for recognized automated browsers", () => {
    expect(adsterraDelivery("preview.vercel.app", "Mozilla/5.0")).toBeNull();
    expect(adsterraDelivery("localhost", "Mozilla/5.0")).toBeNull();
    expect(adsterraDelivery("storyflop.com", "Googlebot")).toBeNull();
    expect(adsterraDelivery("storyflop.com", "Mozilla/5.0 HeadlessChrome/130")).toBeNull();
    expect(adsterraDelivery("storyflop.com", "Mozilla/5.0 Chrome/130")).toBe("live");
  });
});
