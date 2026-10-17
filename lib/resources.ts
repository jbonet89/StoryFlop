import { cache } from "react";
import type base from "@/messages/resources/es.json";
import type { SupportedLocale } from "@/i18n/config";

export const resourceDate = "2026-10-17";
export const resourceReviewedDate = "2026-10-17";
export const guideSlugs = ["primera-sesion", "resolver-desacuerdos", "historias-listas-para-estimar", "dividir-historias", "interpretar-resultados", "sesiones-remotas"] as const;
export interface ResourceGuide {
  slug: string; title: string; description: string; category: string;
  sections: { id: string; title: string; paragraphs: string[]; checklist?: string[] }[];
  sources: { label: string; url: string }[];
  cases?: { title: string; before: string; after: string; decision: string }[];
}
export type ResourceContent = Omit<typeof base, "guides"> & { guides: ResourceGuide[] };
export type ResourceCopy = ResourceContent["ui"];
export const getResourceContent = cache(async (locale: SupportedLocale): Promise<ResourceContent> =>
  (await import(`../messages/resources/${locale}.json`)).default as ResourceContent
);
