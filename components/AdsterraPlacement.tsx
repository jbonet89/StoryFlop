"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { adsterraEnabled, adsterraFormats, type AdsterraFormat } from "@/lib/adsterra";
import { adsterraFrameHtml } from "@/lib/adsterra-frame";
import { useAdvertisingChoice } from "@/lib/advertising-consent";

function AdFrame({ format, label }: { format: AdsterraFormat; label: string }) {
  const iframe = useRef<HTMLIFrameElement>(null); const unit = adsterraFormats[format];
  const [height, setHeight] = useState<number>(unit.height); const [empty, setEmpty] = useState(false);
  useEffect(() => {
    let rendered = false;
    function receive(event: MessageEvent) {
      if (event.source !== iframe.current?.contentWindow || event.data?.type !== "storyflop-ad") return;
      if (event.data.status === "empty" && !rendered) setEmpty(true);
      if (event.data.status === "rendered") {
        const next = Number(event.data.height);
        if (!Number.isFinite(next) || next < 1 || next > 3000) return;
        rendered = true; setHeight(format === "native" ? Math.ceil(next) : unit.height);
      }
    }
    window.addEventListener("message", receive);
    const timeout = window.setTimeout(() => { if (!rendered) setEmpty(true); }, 12000);
    return () => { window.removeEventListener("message", receive); window.clearTimeout(timeout); };
  }, [format, unit.height]);
  if (empty) return null;
  return <aside className="adsterra-ad" aria-label={label} data-ad-format={format}>
    <span className="adsterra-label">{label}</span><iframe ref={iframe} title={`${label} · Adsterra`} width={unit.width || "100%"} height={height} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" referrerPolicy="origin" srcDoc={adsterraFrameHtml(format)} />
  </aside>;
}
export function AdsterraPlacement({ kind }: { kind: "banner" | "native" }) {
  const t = useTranslations("Advertising"); const choice = useAdvertisingChoice();
  const host = useRef<HTMLDivElement>(null); const [width, setWidth] = useState(0); const [near, setNear] = useState(false);
  useEffect(() => {
    const element = host.current; if (!element || !adsterraEnabled || choice !== "accepted") return;
    const resize = new ResizeObserver(entries => setWidth(Math.floor(entries[0].contentRect.width))); resize.observe(element);
    const visibility = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setNear(true); visibility.disconnect(); } }, { rootMargin: "200px" }); visibility.observe(element);
    return () => { resize.disconnect(); visibility.disconnect(); };
  }, [choice]);
  const format = kind === "native" ? (width >= 900 ? "native" : null) : width >= 728 ? "leaderboard" : width >= 320 ? "mobile" : null;
  return <div ref={host} className="adsterra-host">{adsterraEnabled && choice === "accepted" && near && format && <AdFrame key={format} format={format} label={t("label")} />}</div>;
}
