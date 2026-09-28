import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdSenseScript } from "@/components/AdSenseScript";
import { WebApplicationStructuredData } from "@/components/WebApplicationStructuredData";
import { LandingPage } from "@/features/rooms/components/LandingPage";
import { isSupportedLocale, localeAlternates, supportedLocales, type SupportedLocale } from "@/i18n/config";
import { APP_NAME } from "@/lib/brand";

type PageProps = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return supportedLocales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: { ...localeAlternates, "x-default": "/" },
    },
    openGraph: {
      title: t("title"),
      description: t("socialDescription"),
      locale: openGraphLocale(locale),
      alternateLocale: supportedLocales.filter(item => item !== locale).map(openGraphLocale),
      siteName: APP_NAME,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: APP_NAME }],
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("socialDescription"), images: ["/og.png"] },
  };
}

function openGraphLocale(locale: SupportedLocale) {
  const locales: Record<SupportedLocale, string> = {
    es: "es_ES", en: "en_US", fr: "fr_FR", it: "it_IT", de: "de_DE",
    pt: "pt_PT", ca: "ca_ES", eu: "eu_ES", ru: "ru_RU",
  };
  return locales[locale];
}

export default async function LocalizedHome({ params }: PageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return <><WebApplicationStructuredData /><AdSenseScript /><LandingPage /></>;
}
