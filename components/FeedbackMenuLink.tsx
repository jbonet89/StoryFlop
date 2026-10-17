import { ExternalLink, Lightbulb } from "lucide-react";
import { resourceHref } from "@/lib/resource-links";
import { isSupportedLocale } from "@/i18n/config";

export function FeedbackMenuLink({ locale, label, newTabLabel, onClick }: { locale: string; label: string; newTabLabel: string; onClick?: () => void }) {
  return <a className="feedback-menu-link" href={`${resourceHref(isSupportedLocale(locale) ? locale : "en", "/sobre-storyflop")}#proponer-mejora`} target="_blank" rel="noopener noreferrer" aria-label={`${label} (${newTabLabel})`} onClick={onClick}><Lightbulb size={15} aria-hidden="true" /><span>{label}</span><ExternalLink size={13} aria-hidden="true" /></a>;
}
