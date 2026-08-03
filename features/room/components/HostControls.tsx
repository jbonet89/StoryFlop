"use client";
import { useState } from "react";
import { Eye, RotateCcw, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { DECK } from "@/lib/constants";
import type { PokerTask, Round } from "@/lib/types";

export function HostControls({ task, round, canReveal, onReveal, onRestart, onCancel, onFinalize }: { task?: PokerTask; round?: Round; canReveal: boolean; onReveal: () => void; onRestart: () => void; onCancel: () => void; onFinalize: (estimate: string) => void }) {
  const t = useTranslations("Voting");
  const tCommon = useTranslations("Common");
  const [estimate, setEstimate] = useState("");
  if (!task || !round) return null;
  if (round.status === "voting") return <div className="host-controls"><button className="reveal-button" disabled={!canReveal} onClick={onReveal}><Eye size={17} />{t("reveal")}</button><button className="soft-button" onClick={onCancel}><X size={16} />{t("cancelRound")}</button><span>{canReveal ? t("canReveal") : t("needVote")}</span></div>;
  if (round.status === "revealed") return <div className="host-controls final"><button className="soft-button" onClick={onRestart}><RotateCcw size={16} />{t("newRound")}</button><label>{t("finalEstimate")}<select value={estimate} onChange={e => setEstimate(e.target.value)}><option value="">{tCommon("choose")}</option>{DECK.map(value => <option key={value}>{value}</option>)}</select></label><button className="reveal-button" disabled={!estimate} onClick={() => onFinalize(estimate)}><Sparkles size={16} />{t("finishTask")}</button></div>;
  return null;
}
