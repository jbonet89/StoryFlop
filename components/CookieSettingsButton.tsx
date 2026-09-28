"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

declare global {
  interface Window {
    googlefc?: {
      callbackQueue?: Array<() => void>;
      showRevocationMessage?: () => void;
    };
  }
}

function queueGooglePrivacySettings() {
  window.googlefc ??= {};
  window.googlefc.callbackQueue ??= [];
  if (window.googlefc.showRevocationMessage) window.googlefc.showRevocationMessage();
  else window.googlefc.callbackQueue.push(() => window.googlefc?.showRevocationMessage?.());
}

export function CookieSettingsButton({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("privacy-settings") !== "1") return;
    queueGooglePrivacySettings();
    url.searchParams.delete("privacy-settings");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  function openSettings() {
    if (!/^\/[a-z]{2}\/?$/.test(window.location.pathname)) {
      window.location.assign(`/${locale}?privacy-settings=1#privacy-settings`);
      return;
    }
    queueGooglePrivacySettings();
  }

  return <button id="privacy-settings" className="cookie-settings-link" type="button" onClick={openSettings}>{children}</button>;
}
