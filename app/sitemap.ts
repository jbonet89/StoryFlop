import type { MetadataRoute } from "next";
import { supportedLocales } from "@/i18n/config";
import { guides, resourceDate } from "@/lib/resources";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storyflop.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    ...["/recursos", "/demo", "/sobre-storyflop", "/recursos/plantilla-refinamiento", ...guides.map(guide => `/recursos/${guide.slug}`)].map(path => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(resourceDate),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
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
