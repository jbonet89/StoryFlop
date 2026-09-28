import { NextRequest, NextResponse } from "next/server";
import { isSupportedLocale, localeCookieName, resolveLocalePreference } from "@/i18n/config";

export function proxy(request: NextRequest) {
  const firstSegment = request.nextUrl.pathname.split("/")[1];

  if (request.nextUrl.pathname === "/") {
    const locale = resolveLocalePreference(
      request.cookies.get(localeCookieName)?.value,
      request.headers.get("accept-language"),
    );
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  if (isSupportedLocale(firstSegment)) {
    const headers = new Headers(request.headers);
    headers.set("x-storyflop-locale", firstSegment);
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
