import { afterEach, describe, expect, it, vi } from "vitest";
import { consentKey, readAdvertisingChoice, setAdvertisingChoice } from "@/lib/advertising-consent";
afterEach(() => vi.unstubAllGlobals());
function storage() {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) });
  vi.stubGlobal("window", new EventTarget());
  return data;
}
describe("advertising consent", () => {
  it("requires explicit consent; malformed, expired and removed preferences do not authorize ads", () => {
    const data = storage(); expect(readAdvertisingChoice()).toBeNull();
    data.set(consentKey, '{"choice":"accepted","version":1,"expiresAt":0}'); expect(readAdvertisingChoice()).toBeNull();
    data.set(consentKey, "invalid"); expect(readAdvertisingChoice()).toBeNull();
    setAdvertisingChoice("accepted"); expect(readAdvertisingChoice()).toBe("accepted");
    data.delete(consentKey); expect(readAdvertisingChoice()).toBeNull();
  });
  it("persists rejection with the same expiry and notifies mounted placements immediately", () => {
    const data = storage(); const listener = vi.fn(); window.addEventListener("storyflop-advertising-change", listener);
    setAdvertisingChoice("accepted"); setAdvertisingChoice("rejected");
    expect(readAdvertisingChoice()).toBe("rejected"); expect(listener).toHaveBeenCalledTimes(2);
    const value = JSON.parse(data.get(consentKey)!); expect(Object.keys(value).sort()).toEqual(["choice", "expiresAt", "version"]);
    expect(value.expiresAt - Date.now()).toBeLessThanOrEqual(180 * 86400000);
  });
  it("allows rejection when storage is blocked", () => {
    storage(); vi.stubGlobal("localStorage", { getItem: () => { throw Error(); }, setItem: () => { throw Error(); } });
    setAdvertisingChoice("rejected"); expect(readAdvertisingChoice()).toBe("rejected");
  });
});
