"use client";
import { useEffect } from "react";
import { openAdvertisingSettings } from "@/lib/advertising-consent";
export function CookieSettingsButton({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("privacy-settings") !== "1") return;
    openAdvertisingSettings(); url.searchParams.delete("privacy-settings");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);
  return <button id="privacy-settings" className="cookie-settings-link" type="button" onClick={openAdvertisingSettings}>{children}</button>;
}
