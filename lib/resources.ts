import { cache } from "react";
import type base from "@/messages/resources/es.json";
import type { SupportedLocale } from "@/i18n/config";

export const resourceDate = "2026-10-17";
export const resourceReviewedDate = "2026-10-17";
export const guideSlugs = ["primera-sesion", "resolver-desacuerdos", "historias-listas-para-estimar"] as const;
export type ResourceContent = typeof base;
export type ResourceCopy = ResourceContent["ui"];
export const getResourceContent = cache(async (locale: SupportedLocale): Promise<ResourceContent> =>
  (await import(`../messages/resources/${locale}.json`)).default as ResourceContent
);
