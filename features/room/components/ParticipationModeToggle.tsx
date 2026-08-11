"use client";
import { Eye, Vote } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ParticipationMode, RoundStatus } from "@/lib/types";

export function ParticipationModeToggle({
  preference,
  currentMode,
  roundStatus,
  changing,
  onChange,
}: {
  preference: ParticipationMode;
  currentMode?: ParticipationMode;
  roundStatus?: RoundStatus;
  changing: boolean;
  onChange: (mode: ParticipationMode) => void;
}) {
  const t = useTranslations("Participation");
  const appliesToCurrentRound = roundStatus === "voting";
  const selectedMode = appliesToCurrentRound ? currentMode ?? preference : preference;
  const lockedRound = roundStatus === "revealed";
  const help = lockedRound
    ? t("lockedSummary", { mode: currentMode === "observer" ? t("observer") : t("voter") })
    : appliesToCurrentRound ? t("currentChange") : t("nextChange");

  return <section className="participation-control" aria-label={t("title")} aria-describedby="participation-help">
    <div className="participation-options" role="group" aria-label={lockedRound ? t("nextGroup") : t("modeGroup")}>
      <button type="button" className={selectedMode === "voter" ? "selected" : ""} aria-pressed={selectedMode === "voter"} disabled={changing} onClick={() => onChange("voter")}><Vote size={15} />{t("voter")}</button>
      <button type="button" className={selectedMode === "observer" ? "selected" : ""} aria-pressed={selectedMode === "observer"} disabled={changing} onClick={() => onChange("observer")}><Eye size={15} />{t("observer")}</button>
    </div>
    <span id="participation-help" className="participation-tooltip" role="tooltip"><strong>{help}</strong>{t("observerHelp")}</span>
  </section>;
}
