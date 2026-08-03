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

  return <section className="participation-control" aria-labelledby="participation-title">
    <div className="participation-copy">
      <strong id="participation-title">{lockedRound ? t("currentTitle") : t("title")}</strong>
      {lockedRound && <span>{t("lockedSummary", { mode: currentMode === "observer" ? t("observer") : t("voter") })}</span>}
      {!lockedRound && <span>{appliesToCurrentRound ? t("currentChange") : t("nextChange")}</span>}
    </div>
    <div className="participation-options" role="group" aria-label={lockedRound ? t("nextGroup") : t("modeGroup")}>
      <button type="button" className={selectedMode === "voter" ? "selected" : ""} aria-pressed={selectedMode === "voter"} disabled={changing} onClick={() => onChange("voter")}><Vote size={15} />{t("voter")}</button>
      <button type="button" className={selectedMode === "observer" ? "selected" : ""} aria-pressed={selectedMode === "observer"} disabled={changing} onClick={() => onChange("observer")}><Eye size={15} />{t("observer")}</button>
    </div>
    <p>{t("observerHelp")}</p>
  </section>;
}
