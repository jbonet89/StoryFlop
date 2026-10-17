"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { SupportedLocale } from "@/i18n/config";
import { resourceHref } from "@/lib/resource-links";
import { useClientReady } from "@/lib/use-client-ready";
import { DECK, type VoteValue } from "@/lib/constants";
import { calculateRoundStats, formatStatistic } from "@/lib/statistics";

export function PlanningDemo() {
  const ready = useClientReady();
  const t = useTranslations("Resources");
  const locale = useLocale() as SupportedLocale;
  const [stage, setStage] = useState<"vote" | "revealed" | "revote" | "finished">("vote");
  const [vote, setVote] = useState<VoteValue | null>(null);
  const revealed = stage === "revealed" || stage === "finished";
  const secondRound = stage === "revote" || stage === "finished";
  const values: VoteValue[] = secondRound ? ["5", "5", "5"] : ["3", "5", "13"];
  const stats = calculateRoundStats(vote ? [...values, vote] : values);
  const phase = stage === "vote" ? 1 : stage === "revealed" ? 2 : stage === "revote" ? 3 : 4;

  return <section className="demo-workspace" aria-labelledby="demo-heading">
    <div className="demo-topline"><span>{t("practiceLabel")}</span><button type="button" disabled={!ready} onClick={() => { setStage("vote"); setVote(null); }}>{t("reset")}</button></div>
    <ol className="demo-progress" aria-label={t("progress")}>{["stepVote", "stepDiscuss", "stepRepeat", "stepFinish"].map((key, index) => <li key={key} aria-current={phase === index + 1 ? "step" : undefined}><span>{index + 1}</span>{t(key)}</li>)}</ol>
    <div className="demo-task"><span className="resource-eyebrow">{t("practiceStory")}</span><h2 id="demo-heading">{t("taskTitle")}</h2><p>{t("taskBody")}</p><p><strong>{t(secondRound ? "scopeLabel" : "beforeVote")}</strong> {t(secondRound ? "scopeBody" : "beforeBody")}</p></div>
    <div className="demo-status" role="status" aria-live="polite"><strong>{t("step", { phase })} · {t(stage === "vote" ? "phaseVote" : stage === "revealed" ? "phaseDiscuss" : stage === "revote" ? "phaseRepeat" : "phaseFinish")}</strong><p>{t(revealed ? "revealedBody" : "hiddenBody")}</p></div>
    <div className="demo-players" aria-label={t("players")}>{["Ana", "Bruno", "Cris", t("you")].map((name, index) => <div className="demo-player" key={name}><span>{name}</span><strong aria-label={`${name}: ${index === 3 ? vote ?? t("noVote") : revealed ? values[index] : t("hiddenVote")}`}>{index === 3 ? vote ?? "—" : revealed ? values[index] : "?"}</strong><small>{index === 3 ? t(vote ? "yourChoice" : "chooseCard") : t(revealed ? "revealedVote" : "hasVoted")}</small></div>)}</div>
    {!revealed && <fieldset className="demo-deck"><legend>{t(secondRound ? "estimateSecond" : "estimateInitial")}</legend><div>{DECK.map(value => <button key={value} type="button" disabled={!ready} aria-label={value === "?" ? t("unsure") : value === "☕" ? t("pause") : t("estimate", { value })} aria-pressed={vote === value} onClick={() => setVote(value)}>{value}</button>)}</div></fieldset>}
    {!revealed && <button className="resource-button" type="button" disabled={!ready || !vote} onClick={() => setStage(secondRound ? "finished" : "revealed")}>{t(secondRound ? "revealSecond" : "reveal")}</button>}
    {revealed && <div className="demo-results"><h3>{t("numbers")}</h3><dl><div><dt>{t("mean")}</dt><dd>{formatStatistic(stats.average, locale, t("unavailable"))}</dd></div><div><dt>{t("median")}</dt><dd>{formatStatistic(stats.median, locale, t("unavailable"))}</dd></div><div><dt>{t("equalVotes")}</dt><dd>{t(stats.consensus ? "yes" : "no")}</dd></div></dl><p>{t("calculation")}</p></div>}
    {stage === "revealed" && <div className="demo-discussion"><h3>{t("whyDifferent")}</h3><ul>{["anaReason", "brunoReason", "crisReason"].map((key, i) => <li key={key}><strong>{["Ana · 3", "Bruno · 5", "Cris · 13"][i]}:</strong> {t(key)}</li>)}</ul><p>{t("discussBody")}</p><button className="resource-button" type="button" onClick={() => { setVote(null); setStage("revote"); }}>{t("clarify")} →</button></div>}
    {stage === "finished" && <div className="demo-discussion"><h3>{t(vote === "5" ? "agreed" : vote === "?" || vote === "☕" ? "stopDiscuss" : "difference")}</h3><p>{t(vote === "5" ? "agreedBody" : "differenceBody")}</p><p><strong>{t("closingLabel")}</strong> {t("closingBody")}</p><a href={resourceHref(locale, "/recursos/plantilla-refinamiento")}>{t("saveContext")} →</a></div>}
    <noscript><p>{t("needsJs")} <a href={resourceHref(locale, "/recursos/resolver-desacuerdos")}>{t("fullCase")}</a></p></noscript>
  </section>;
}
