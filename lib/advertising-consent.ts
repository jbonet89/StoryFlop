"use client";
import { useSyncExternalStore } from "react";
import { discardAdsterraRuntime } from "@/lib/adsterra-runtime";
export const consentKey = "storyflop.advertising.v2";
const changed = "storyflop-advertising-change";
export type AdvertisingChoice = "accepted" | "rejected" | null;
let memoryChoice: AdvertisingChoice = null;
let memoryUntil = 0;
let memoryOnly = false;
export function readAdvertisingChoice(): AdvertisingChoice {
  if (typeof window === "undefined") return null;
  try {
    const saved = JSON.parse(localStorage.getItem(consentKey) ?? "null");
    if (saved?.version === 2 && saved.expiresAt > Date.now() && ["accepted", "rejected"].includes(saved.choice)) return saved.choice;
    return memoryOnly && memoryUntil > Date.now() ? memoryChoice : null;
  } catch { /* Storage may be blocked. Keep the decision in memory for this document. */ }
  return memoryUntil > Date.now() ? memoryChoice : null;
}
export function setAdvertisingChoice(choice: Exclude<AdvertisingChoice, null>) {
  memoryChoice = choice; memoryUntil = Date.now() + 180 * 86400000;
  try { localStorage.setItem(consentKey, JSON.stringify({ version: 2, choice, expiresAt: memoryUntil })); memoryOnly = false; } catch { memoryOnly = true; }
  window.dispatchEvent(new Event(changed));
  if (choice === "rejected") discardAdsterraRuntime();
}
function subscribe(callback: () => void) {
  const notify = () => { if (readAdvertisingChoice() !== "accepted") discardAdsterraRuntime(); callback(); };
  window.addEventListener(changed, notify); window.addEventListener("storage", notify);
  window.addEventListener("focus", notify);
  const timer = window.setInterval(notify, 60_000);
  return () => { window.removeEventListener(changed, notify); window.removeEventListener("storage", notify); window.removeEventListener("focus", notify); window.clearInterval(timer); };
}
export function useAdvertisingChoice() { return useSyncExternalStore(subscribe, readAdvertisingChoice, () => null); }
export function openAdvertisingSettings() { window.dispatchEvent(new Event("storyflop-advertising-settings")); }

let placements = 0;
const placementChanged = "storyflop-advertising-placement";
export function registerAdvertisingPlacement() {
  placements++; window.dispatchEvent(new Event(placementChanged));
  return () => { placements--; window.dispatchEvent(new Event(placementChanged)); };
}
function subscribePlacements(callback: () => void) { window.addEventListener(placementChanged, callback); return () => window.removeEventListener(placementChanged, callback); }
export function useAdvertisingPlacements() { return useSyncExternalStore(subscribePlacements, () => placements, () => 0); }
