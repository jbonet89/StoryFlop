import { z } from "zod";
import { supportedLocales } from "@/i18n/config";

export const trackedGuides = ["primera-sesion", "resolver-desacuerdos", "historias-listas-para-estimar", "dividir-historias", "interpretar-resultados", "sesiones-remotas"] as const;
export const resourceIds = ["index", "demo", "template", "about", "home", ...trackedGuides] as const;
export const usageEvents = ["resource_view", "guide_end_reached", "demo_started", "demo_completed", "template_copy", "template_download", "template_print", "room_create_intent", "room_created"] as const;
export type ResourceId = (typeof resourceIds)[number];
export type UsageEvent = (typeof usageEvents)[number];
export const resourceEventSchema = z.object({ event: z.enum(usageEvents), locale: z.enum(supportedLocales), resource: z.enum(resourceIds) }).strict().refine(({ event, resource }) => {
  if (event === "resource_view") return resource !== "home";
  if (event === "guide_end_reached") return (trackedGuides as readonly string[]).includes(resource);
  if (event.startsWith("demo_")) return resource === "demo";
  if (event.startsWith("template_")) return resource === "template";
  if (event === "room_created") return resource === "home";
  return event === "room_create_intent" && resource !== "home";
});
export type ResourceEvent = z.infer<typeof resourceEventSchema>;
export function resourceFromPath(pathname: string): ResourceId | null {
  const path = pathname.replace(/^\/(es|en|fr|it|de|pt|ca|eu|ru)(?=\/|$)/, "").replace(/\/$/, "");
  if (path === "/recursos") return "index";
  if (path === "/demo") return "demo";
  if (path === "/sobre-storyflop") return "about";
  if (path === "/recursos/plantilla-refinamiento") return "template";
  const slug = path.replace(/^\/recursos\//, "");
  return (trackedGuides as readonly string[]).includes(slug) ? slug as ResourceId : null;
}
