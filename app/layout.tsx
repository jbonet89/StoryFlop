import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { APP_NAME } from "@/lib/brand";
import "./globals.css";
import { Providers } from "./providers";

export const viewport: Viewport = {
  themeColor: "#FF645A",
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    applicationName: APP_NAME,
    title: { default: t("title"), template: `%s · ${APP_NAME}` },
    description: t("description"),
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    keywords: ["Agile", "Scrum", "Scrum Poker", "story points", "team estimation", "sprint planning", "user stories"],
    openGraph: { title: t("title"), description: t("socialDescription"), siteName: APP_NAME, images: [{ url: "/og.png", width: 1200, height: 630, alt: APP_NAME }] },
    twitter: { card: "summary_large_image", title: t("title"), description: t("socialDescription"), images: ["/og.png"] },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return <html lang={locale} dir="ltr"><body><NextIntlClientProvider locale={locale} messages={messages}><Providers>{children}</Providers></NextIntlClientProvider></body></html>;
}
