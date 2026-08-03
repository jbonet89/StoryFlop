import { BarChart3, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { calculateRoundStats } from "@/lib/statistics";
import type { Participation, Vote } from "@/lib/types";
import { getEligibleRoundVotes } from "@/lib/participation";
export function RoundResults({ votes, participations }: { votes: Vote[]; participations: Participation[] }) {
  const t = useTranslations("Results");
  const locale = useLocale();
  const eligibleVotes = getEligibleRoundVotes(votes, participations);
  const stats = calculateRoundStats(eligibleVotes.map(vote => vote.value));
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return <section className="round-results"><div className="results-title"><BarChart3 size={17} /><strong>{t("roundResult")}</strong>{stats.consensus && <span><CheckCircle2 size={13} /> {t("consensus")}</span>}</div><div className="stat-grid"><div><span>{t("average")}</span><strong>{stats.average === null ? "—" : number.format(stats.average)}</strong></div><div><span>{t("median")}</span><strong>{stats.median === null ? "—" : number.format(stats.median)}</strong></div><div><span>{t("votes")}</span><strong>{number.format(eligibleVotes.length)}</strong></div></div><div className="distribution">{Object.entries(stats.distribution).map(([value, count]) => <span key={value}><b>{value}</b><i style={{ width: `${Math.max(12, (count / eligibleVotes.length) * 100)}%` }} /><small>{number.format(count)}</small></span>)}</div></section>;
}
