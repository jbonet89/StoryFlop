import { afterEach, describe, expect, it, vi } from "vitest";
import { watchRoomRecovery } from "@/lib/room-recovery";

afterEach(() => vi.useRealTimers());
describe("browser lifecycle recovery", () => {
  for (const event of ["focus", "pageshow", "online", "visibilitychange"]) {
    it(`recovers on ${event} and removes listeners on cleanup`, () => {
      vi.useFakeTimers();
      const browser = Object.assign(new EventTarget(), { navigator: { onLine: true } });
      const page = Object.assign(new EventTarget(), { visibilityState: "visible" });
      const recover = vi.fn();
      const stop = watchRoomRecovery(recover, browser as unknown as Window & typeof globalThis, page as unknown as Document);
      (event === "visibilitychange" ? page : browser).dispatchEvent(new Event(event));
      vi.advanceTimersByTime(100);
      expect(recover).toHaveBeenCalledTimes(1);
      stop();
      browser.dispatchEvent(new Event("focus"));
      vi.advanceTimersByTime(100);
      expect(recover).toHaveBeenCalledTimes(1);
    });
  }
  it("coalesces resume events, ignores hidden/offline pages and cancels pending recovery", () => {
    vi.useFakeTimers();
    const browser = Object.assign(new EventTarget(), { navigator: { onLine: true } });
    const page = Object.assign(new EventTarget(), { visibilityState: "hidden" });
    const recover = vi.fn();
    const stop = watchRoomRecovery(recover, browser as unknown as Window & typeof globalThis, page as unknown as Document);
    browser.dispatchEvent(new Event("focus"));
    vi.advanceTimersByTime(100);
    expect(recover).not.toHaveBeenCalled();
    page.visibilityState = "visible";
    browser.navigator.onLine = false;
    browser.dispatchEvent(new Event("focus"));
    vi.advanceTimersByTime(100);
    expect(recover).not.toHaveBeenCalled();
    browser.navigator.onLine = true;
    for (const event of ["online", "focus", "pageshow"]) browser.dispatchEvent(new Event(event));
    vi.advanceTimersByTime(100);
    expect(recover).toHaveBeenCalledTimes(1);
    browser.dispatchEvent(new Event("pageshow"));
    stop();
    vi.advanceTimersByTime(100);
    expect(recover).toHaveBeenCalledTimes(1);
  });
});
