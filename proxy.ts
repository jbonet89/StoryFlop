import { NextRequest, NextResponse } from "next/server";
import { isSupportedLocale, localeCookieName, resolveLocalePreference } from "@/i18n/config";
import { resourceRoots } from "@/lib/resource-links";

export function proxy(request: NextRequest) {
  const firstSegment = request.nextUrl.pathname.split("/")[1];
  const secondSegment = request.nextUrl.pathname.split("/")[2];

  if (firstSegment === "es" && resourceRoots.includes(secondSegment)) {
    const url = request.nextUrl.clone();
    url.pathname = url.pathname.slice(3);
    return NextResponse.redirect(url, 308);
  }

  if (request.nextUrl.pathname === "/") {
    const locale = resolveLocalePreference(
      request.cookies.get(localeCookieName)?.value,
      request.headers.get("accept-language"),
    );
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  if (isSupportedLocale(firstSegment) || resourceRoots.includes(firstSegment)) {
    const headers = new Headers(request.headers);
    headers.set("x-storyflop-locale", isSupportedLocale(firstSegment) ? firstSegment : "es");
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
