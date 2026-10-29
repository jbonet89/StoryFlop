export const adsterraEnabled = process.env.NEXT_PUBLIC_ADSTERRA_ENABLED !== "false";
export const adsterraFormats = {
  leaderboard: { key: "31210775e07ed4d1bfb4e74bfbe50383", width: 728, height: 90 },
  mobile: { key: "2cef96db594fff17ce9c57edb12b315c", width: 320, height: 50 },
  rectangle: { key: "0082de9655db330634ceb0623b845da8", width: 300, height: 250 },
  native: { key: "973a91795cf468905d9b39cff1f465ba", width: 0, height: 220 },
} as const;
export type AdsterraFormat = keyof typeof adsterraFormats;

// Fixtures never contact the ad network. Do not enable this flag on production.
export const adsterraTestMode = process.env.NEXT_PUBLIC_ADSTERRA_TEST_MODE === "true";
export function adsterraDelivery(hostname: string, userAgent: string): "live" | "fixture" | null {
  if (adsterraTestMode && ["localhost", "127.0.0.1"].includes(hostname)) return "fixture";
  if (!["storyflop.com", "www.storyflop.com"].includes(hostname)) return null;
  if (/bot|crawler|spider|HeadlessChrome|Playwright/i.test(userAgent)) return null;
  return "live";
}
