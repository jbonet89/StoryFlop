"use client";
import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import type { SupportedLocale } from "@/i18n/config";
import { resourceFromPath, trackedGuides } from "@/lib/resource-events";
import { recordResourceUsage } from "@/lib/resource-usage-client";

export function ResourceTelemetry() {
  const locale = useLocale() as SupportedLocale;
  const pathname = usePathname();
  const viewed = useRef("");
  useEffect(() => {
    const resource = resourceFromPath(pathname);
    if (!resource) return;
    if (viewed.current !== `${locale}:${resource}`) {
      recordResourceUsage({ event: "resource_view", locale, resource }); viewed.current = `${locale}:${resource}`;
    }
    function clicked(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest("a");
      if (!anchor) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin === window.location.origin && destination.pathname === `/${locale}` && destination.hash === "#entry-title") recordResourceUsage({ event: "room_create_intent", locale, resource: resource! });
    }
    document.addEventListener("click", clicked);
    const end = document.querySelector("[data-guide-end]");
    let observer: IntersectionObserver | undefined;
    if (end && (trackedGuides as readonly string[]).includes(resource) && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting) && document.visibilityState === "visible") {
          recordResourceUsage({ event: "guide_end_reached", locale, resource: resource! });
          observer?.disconnect();
        }
      }); observer.observe(end);
    }
    return () => { document.removeEventListener("click", clicked); observer?.disconnect(); };
  }, [locale, pathname]);
  return null;
}
