"use client";

import { useState, useTransition } from "react";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale } from "@/i18n/actions";
import { isSupportedLocale, localeNames, supportedLocales, type SupportedLocale } from "@/i18n/config";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const currentLocale = useLocale() as SupportedLocale;
  const t = useTranslations("Language");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [announcement, setAnnouncement] = useState("");

  function changeLocale(value: string) {
    if (!isSupportedLocale(value) || value === currentLocale) return;
    startTransition(async () => {
      await setLocale(value);
      document.documentElement.lang = value;
      setAnnouncement(t("changed", { language: localeNames[value] }));
      router.refresh();
    });
  }

  return <div className={`language-selector ${compact ? "compact" : ""}`}>
    <Languages size={15} aria-hidden="true" />
    <label className={compact ? "sr-only" : undefined} htmlFor={`language-${compact ? "menu" : "home"}`}>{t("label")}</label>
    <select id={`language-${compact ? "menu" : "home"}`} value={currentLocale} disabled={isPending} onChange={event => changeLocale(event.target.value)} aria-label={compact ? t("label") : undefined}>
      {supportedLocales.map(locale => <option key={locale} value={locale}>{localeNames[locale]}</option>)}
    </select>
    <span className="sr-only" aria-live="polite">{announcement}</span>
  </div>;
}
