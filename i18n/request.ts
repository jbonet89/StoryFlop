import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { localeCookieName, resolveLocalePreference } from "./config";
import { mergeMessages, type MessageTree } from "./messages";

export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocalePreference(cookieStore.get(localeCookieName)?.value, headerStore.get("accept-language"));
  const fallback = (await import("../messages/es.json")).default as MessageTree;
  const localized = locale === "es" ? fallback : (await import(`../messages/${locale}.json`)).default as MessageTree;
  const messages = mergeMessages(fallback, localized);
  return { locale, messages };
});
