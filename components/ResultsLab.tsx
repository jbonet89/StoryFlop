"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { calculateRoundStats, formatStatistic } from "@/lib/statistics";
import type { VoteValue } from "@/lib/constants";
import { useClientReady } from "@/lib/use-client-ready";

const scenarios: { label: string; votes: VoteValue[] }[] = [
  { label: "labScope", votes: ["3", "5", "13"] },
  { label: "labOutlier", votes: ["5", "5", "5", "21"] },
  { label: "labMixed", votes: ["0", "5", "?"] },
  { label: "labUnknown", votes: ["?", "☕"] },
];
export function ResultsLab() {
  const t = useTranslations("Resources"); const locale = useLocale();
  const [selected, setSelected] = useState(0); const ready = useClientReady();
  const { votes } = scenarios[selected]; const stats = calculateRoundStats(votes);
  return <section className="results-lab" aria-labelledby="lab-title"><span className="resource-eyebrow">StoryFlop</span><h2 id="lab-title">{t("labTitle")}</h2><p>{t("labLead")}</p>
    <label htmlFor="lab-scenario">{t("labScenario")}</label><select id="lab-scenario" value={selected} disabled={!ready} onChange={event => setSelected(Number(event.target.value))}>{scenarios.map((scenario, index) => <option value={index} key={scenario.label}>{t(scenario.label)}</option>)}</select>
    <div className="lab-votes" aria-hidden="true">{votes.map((vote, index) => <span key={index}>{vote}</span>)}</div>
    <div className="demo-results" role="status" aria-live="polite"><dl><div><dt>{t("mean")}</dt><dd data-stat="mean">{formatStatistic(stats.average, locale, t("unavailable"))}</dd></div><div><dt>{t("median")}</dt><dd data-stat="median">{formatStatistic(stats.median, locale, t("unavailable"))}</dd></div><div><dt>{t("equalVotes")}</dt><dd>{t(stats.consensus ? "yes" : "no")}</dd></div></dl>
    <ul className="lab-distribution">{Object.entries(stats.distribution).map(([card, count]) => <li key={card}><strong>{card}</strong><span aria-hidden="true"> × </span>{count}</li>)}</ul></div><p>{t("labNote")}</p>
  </section>;
}
