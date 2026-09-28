import type { MetadataRoute } from "next";
import { supportedLocales } from "@/i18n/config";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storyflop.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    ...supportedLocales.map(locale => ({
      url: `${siteUrl}/${locale}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: locale === "es" ? 1 : 0.9,
      alternates: {
        languages: Object.fromEntries(supportedLocales.map(item => [item, `${siteUrl}/${item}`])),
      },
    })),
    { url: `${siteUrl}/aviso-legal`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacidad`, lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/cookies`, lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
