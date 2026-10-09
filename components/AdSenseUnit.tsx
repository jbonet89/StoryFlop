"use client";

import { useEffect, useRef } from "react";

const ADSENSE_CLIENT = "ca-pub-2657741160026304";

declare global {
  interface Window {
    adsbygoogle?: Record<string, never>[];
  }
}

type AdSenseUnitProps = {
  slot: string;
  format: "auto" | "autorelaxed";
  label: string;
  className?: string;
  fullWidthResponsive?: boolean;
};

export function AdSenseUnit({ slot, format, label, className = "", fullWidthResponsive = false }: AdSenseUnitProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.warn("AdSense unit could not be initialized", error);
    }
  }, []);

  return <aside className={`ad-placement ${className}`.trim()} aria-label={label}>
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      {...(fullWidthResponsive ? { "data-full-width-responsive": "true" } : {})}
    />
  </aside>;
}
