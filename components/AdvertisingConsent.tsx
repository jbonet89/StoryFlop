"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- A fresh document clears third-party advertising before opening legal information. */
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useClientReady } from "@/lib/use-client-ready";
import { adsterraEnabled } from "@/lib/adsterra";
import { setAdvertisingChoice, useAdvertisingChoice, useAdvertisingPlacements } from "@/lib/advertising-consent";
export function AdvertisingConsent() {
  const t = useTranslations("Advertising"); const choice = useAdvertisingChoice();
  const ready = useClientReady(); const placements = useAdvertisingPlacements();
  const [settings, setSettings] = useState(false); const firstButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    function open() { trigger.current = document.activeElement as HTMLElement; setSettings(true); }
    window.addEventListener("storyflop-advertising-settings", open);
    return () => window.removeEventListener("storyflop-advertising-settings", open);
  }, []);
  useEffect(() => { if (settings) firstButton.current?.focus(); }, [settings]);
  if (!ready || (!settings && (!adsterraEnabled || choice !== null || placements === 0))) return null;
  function choose(value: "accepted" | "rejected") { setAdvertisingChoice(value); setSettings(false); trigger.current?.focus(); }
  return <section className="advertising-consent" role="region" aria-labelledby="advertising-consent-title">
    <div><h2 id="advertising-consent-title">{t("consentTitle")}</h2><p>{t("consentBody")}</p><p><a href="/cookies">{t("cookies")}</a> · <a href="https://adsterra.com/privacy-policy/" target="_blank" rel="noreferrer">{t("providerPrivacy")}</a></p></div>
    <div className="advertising-consent-actions"><button ref={firstButton} type="button" onClick={() => choose("rejected")}>{t("reject")}</button><button type="button" onClick={() => choose("accepted")}>{t("accept")}</button>{settings && <button type="button" onClick={() => { setSettings(false); trigger.current?.focus(); }}>{t("close")}</button>}</div>
  </section>;
}
