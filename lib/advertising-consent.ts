"use client";
import { useSyncExternalStore } from "react";
export const consentKey = "storyflop.advertising.v1";
const changed = "storyflop-advertising-change";
export type AdvertisingChoice = "accepted" | "rejected" | null;
let memoryChoice: AdvertisingChoice = null;
let memoryUntil = 0;
let memoryOnly = false;
export function readAdvertisingChoice(): AdvertisingChoice {
  if (typeof window === "undefined") return null;
  try {
    const saved = JSON.parse(localStorage.getItem(consentKey) ?? "null");
    if (saved?.version === 1 && saved.expiresAt > Date.now() && ["accepted", "rejected"].includes(saved.choice)) return saved.choice;
    return memoryOnly && memoryUntil > Date.now() ? memoryChoice : null;
  } catch { /* Storage may be blocked. Keep the decision in memory for this document. */ }
  return memoryUntil > Date.now() ? memoryChoice : null;
}
export function setAdvertisingChoice(choice: Exclude<AdvertisingChoice, null>) {
  memoryChoice = choice; memoryUntil = Date.now() + 180 * 86400000;
  try { localStorage.setItem(consentKey, JSON.stringify({ version: 1, choice, expiresAt: memoryUntil })); memoryOnly = false; } catch { memoryOnly = true; }
  window.dispatchEvent(new Event(changed));
}
function subscribe(callback: () => void) {
  window.addEventListener(changed, callback); window.addEventListener("storage", callback);
  window.addEventListener("focus", callback);
  const timer = window.setInterval(callback, 60_000);
  return () => { window.removeEventListener(changed, callback); window.removeEventListener("storage", callback); window.removeEventListener("focus", callback); window.clearInterval(timer); };
}
export function useAdvertisingChoice() { return useSyncExternalStore(subscribe, readAdvertisingChoice, () => null); }
export function openAdvertisingSettings() { window.dispatchEvent(new Event("storyflop-advertising-settings")); }
