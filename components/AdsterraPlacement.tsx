"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { adsterraEnabled, adsterraDelivery, type AdsterraFormat } from "@/lib/adsterra";
import { loadAdsterraTag } from "@/lib/adsterra-runtime";
import { registerAdvertisingPlacement, useAdvertisingChoice } from "@/lib/advertising-consent";

function AdTag({ format, label }: { format: AdsterraFormat; label: string }) {
  const target = useRef<HTMLDivElement>(null); const initialized = useRef(false);
  const [hasContent, setHasContent] = useState(false); const [failed, setFailed] = useState(false);
  useEffect(() => {
    const container = target.current; if (!container) return;
    const inspect = () => setHasContent(container.getBoundingClientRect().height > 0);
    const resize = new ResizeObserver(inspect); resize.observe(container);
    if (!initialized.current) {
      initialized.current = true;
      loadAdsterraTag(container, format, () => setFailed(true));
    }
    return () => resize.disconnect();
  }, [format]);
  if (failed) return null;
  return <aside className={`adsterra-ad${hasContent ? " has-content" : ""}`} aria-label={label} data-ad-format={format}>
    {hasContent && <span className="adsterra-label">{label}</span>}<div className="adsterra-content" ref={target} />
  </aside>;
}
export function AdsterraPlacement({ kind }: { kind: "banner" | "native" | "rectangle" }) {
  const t = useTranslations("Advertising"); const choice = useAdvertisingChoice();
  const host = useRef<HTMLDivElement>(null); const [format, setFormat] = useState<AdsterraFormat | null>(null); const [near, setNear] = useState(false);
  useEffect(() => {
    if (!adsterraEnabled || !adsterraDelivery(window.location.hostname, navigator.userAgent)) return;
    return registerAdvertisingPlacement();
  }, []);
  useEffect(() => {
    const element = host.current; if (!element || !adsterraEnabled || choice !== "accepted" || !adsterraDelivery(window.location.hostname, navigator.userAgent)) return;
    const resize = new ResizeObserver(entries => {
      const width = Math.floor(entries[0].contentRect.width);
      const next = kind === "rectangle" ? (width >= 300 ? "rectangle" : null) : kind === "native" ? (width >= 900 ? "native" : null) : width >= 728 ? "leaderboard" : width >= 320 ? "mobile" : null;
      // Never reload or resize an already requested creative when the viewport changes.
      setFormat(current => current ?? next);
    }); resize.observe(element);
    const visibility = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setNear(true); visibility.disconnect(); } }, { rootMargin: "200px" }); visibility.observe(element);
    return () => { resize.disconnect(); visibility.disconnect(); };
  }, [choice, kind]);
  return <div ref={host} className="adsterra-host">{adsterraEnabled && choice === "accepted" && near && format && <AdTag key={format} format={format} label={t("label")} />}</div>;
}
