export const supportedLocales = ["es", "en", "de", "pt", "ca", "eu"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "es";
export const localeCookieName = "NEXT_LOCALE";

export const localeNames: Record<SupportedLocale, string> = {
  es: "Español",
  en: "English",
  de: "Deutsch",
  pt: "Português",
  ca: "Català",
  eu: "Euskara",
};

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return supportedLocales.includes(value?.toLowerCase() as SupportedLocale);
}

export function normalizeLocale(value: string): SupportedLocale | null {
  const base = value.trim().toLowerCase().replace(/_/g, "-").split("-")[0];
  return isSupportedLocale(base) ? base : null;
}

export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];
  return header.split(",").map((part, index) => {
    const [locale, ...parameters] = part.trim().split(";");
    const qualityParameter = parameters.find(parameter => parameter.trim().startsWith("q="));
    const parsedQuality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1;
    return { locale, quality: Number.isFinite(parsedQuality) ? parsedQuality : 0, index };
  }).filter(item => item.locale && item.quality > 0).sort((a, b) => b.quality - a.quality || a.index - b.index).map(item => item.locale);
}

export function resolveSupportedLocale(requestedLocales: string[], fallback: SupportedLocale = defaultLocale): SupportedLocale {
  for (const requested of requestedLocales) {
    const locale = normalizeLocale(requested);
    if (locale) return locale;
  }
  return fallback;
}

export function resolveLocalePreference(cookieLocale: string | null | undefined, acceptLanguage: string | null | undefined): SupportedLocale {
  const manual = cookieLocale ? normalizeLocale(cookieLocale) : null;
  return manual ?? resolveSupportedLocale(parseAcceptLanguage(acceptLanguage));
}
