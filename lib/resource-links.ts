import { supportedLocales, type SupportedLocale } from "@/i18n/config";

export const resourceRoots = ["recursos", "demo", "sobre-storyflop"];
export function resourceHref(locale: SupportedLocale, path: string): string {
  return locale === "es" ? path : `/${locale}${path}`;
}
export function resourceAlternates(path: string) {
  return { ...Object.fromEntries(supportedLocales.map(locale => [locale, resourceHref(locale, path)])), "x-default": path };
}
