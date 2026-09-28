import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { isSupportedLocale, localeCookieName, resolveLocalePreference } from "./config";
import { mergeMessages, type MessageTree } from "./messages";

export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const routeLocale = headerStore.get("x-storyflop-locale");
  const locale = isSupportedLocale(routeLocale)
    ? routeLocale
    : resolveLocalePreference(cookieStore.get(localeCookieName)?.value, headerStore.get("accept-language"));
  const spanish = (await import("../messages/es.json")).default as MessageTree;
  const fallback = (["fr", "it", "ru"] as string[]).includes(locale)
    ? (await import("../messages/en.json")).default as MessageTree
    : spanish;
  const localized = locale === "es" ? spanish : (await import(`../messages/${locale}.json`)).default as MessageTree;
  const messages = mergeMessages(fallback, localized);
  return { locale, messages };
});
