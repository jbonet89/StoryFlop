import type { MetadataRoute } from "next";
import { supportedLocales } from "@/i18n/config";
import { guideSlugs, resourceReviewedDate } from "@/lib/resources";
import { resourceAlternates, resourceHref } from "@/lib/resource-links";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storyflop.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    ...supportedLocales.flatMap(locale => ["/recursos", "/demo", "/sobre-storyflop", "/recursos/plantilla-refinamiento", ...guideSlugs.map(slug => `/recursos/${slug}`)].map(path => ({
      url: `${siteUrl}${resourceHref(locale, path)}`,
      lastModified: new Date(resourceReviewedDate),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: { languages: Object.fromEntries(Object.entries(resourceAlternates(path)).map(([language, url]) => [language, `${siteUrl}${url}`])) },
    }))),
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
