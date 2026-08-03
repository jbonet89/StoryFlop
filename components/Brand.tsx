import { useTranslations } from "next-intl";
import { APP_NAME } from "@/lib/brand";

export type BrandProps = {
  compact?: boolean;
  showTagline?: boolean;
  className?: string;
};

type BrandMarkProps = {
  decorative?: boolean;
  className?: string;
};

export function BrandMark({ decorative = false, className = "" }: BrandMarkProps) {
  return (
    <svg
      className={`brand-mark ${className}`.trim()}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : APP_NAME}
      role={decorative ? undefined : "img"}
      focusable="false"
    >
      <rect x="2" y="2" width="60" height="60" rx="15" fill="#FF645A" />
      <g transform="rotate(-9 20.5 35)">
        <rect x="10" y="21" width="21" height="28" rx="5" fill="#F7F3EA" />
        <circle cx="16" cy="28" r="2.2" fill="#F4B740" />
      </g>
      <g transform="rotate(9 43.5 35)">
        <rect x="33" y="21" width="21" height="28" rx="5" fill="#F7F3EA" />
        <circle cx="48" cy="42" r="2.2" fill="#F4B740" />
      </g>
      <rect x="20" y="14" width="24" height="37" rx="6" fill="#FFFDF8" stroke="#D94841" strokeWidth="1.4" />
      <path d="M27 22.5h11v4H31v3h6v4h-6v7h-4z" fill="#075B46" />
      <circle cx="37" cy="41" r="2.5" fill="#F4B740" />
    </svg>
  );
}

export function Brand({ compact = false, showTagline = false, className = "" }: BrandProps) {
  const t = useTranslations("Brand");
  return (
    <div className={`brand${compact ? " brand-compact" : ""}${showTagline ? " brand-full" : ""}${className ? ` ${className}` : ""}`}>
      <BrandMark decorative={!compact} />
      {!compact && <span className="brand-copy"><span className="brand-name">{APP_NAME}</span>{showTagline && <span className="brand-tagline">{t("tagline")}</span>}</span>}
    </div>
  );
}

