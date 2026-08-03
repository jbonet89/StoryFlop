"use server";

import { cookies } from "next/headers";
import { isSupportedLocale, localeCookieName, type SupportedLocale } from "./config";

export async function setLocale(locale: SupportedLocale) {
  if (!isSupportedLocale(locale)) throw new Error("UNSUPPORTED_LOCALE");
  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
}
