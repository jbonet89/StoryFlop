import type { MetadataRoute } from "next";
import { supportedLocales } from "@/i18n/config";
import { guideSlugs, resourceReviewedDate } from "@/lib/resources";
import { resourceAlternates, resourceHref } from "@/lib/resource-links";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://storyflop.com";

export default function sitemap(): MetadataRoute.Sitemap {
  // Content revision dates: deployments alone do not change these pages.
  const homeLastModified = new Date("2026-10-29");
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
      lastModified: homeLastModified,
      changeFrequency: "weekly" as const,
      priority: locale === "es" ? 1 : 0.9,
      alternates: {
        languages: Object.fromEntries(supportedLocales.map(item => [item, `${siteUrl}/${item}`])),
      },
    })),
    { url: `${siteUrl}/aviso-legal`, lastModified: new Date("2026-09-28"), changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacidad`, lastModified: new Date("2026-10-29"), changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/cookies`, lastModified: new Date("2026-10-29"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
