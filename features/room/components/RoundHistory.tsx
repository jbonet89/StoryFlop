import { CheckCircle2, Coffee, Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getEligibleRoundVotes, getEligibleVoters } from "@/lib/participation";
import { calculateRoundStats, formatStatistic } from "@/lib/statistics";
import { formatDateTime } from "@/lib/formatting";
import type { Member, Participation, PokerTask, Round, Vote } from "@/lib/types";

export function RoundHistory({ rounds, tasks, members, participations, votes }: { rounds: Round[]; tasks: PokerTask[]; members: Member[]; participations: Participation[]; votes: Vote[] }) {
  const t = useTranslations("RoundHistory");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const visibleRounds = rounds.filter(round => round.status === "revealed" || round.status === "closed").sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (!visibleRounds.length) return <section className="history history-empty"><h2>{t("title")}</h2><p>{t("empty")}</p></section>;
  const memberById = new Map(members.map(member => [member.id, member]));
  const taskById = new Map(tasks.map(task => [task.id, task]));
  const newestRoundByTask = new Map<string, string>();
  for (const round of visibleRounds) if (!newestRoundByTask.has(round.task_id)) newestRoundByTask.set(round.task_id, round.id);

  return <details className="history">
    <summary>{t("summary", { count: visibleRounds.length })}</summary>
    <div className="history-rounds">{visibleRounds.map(round => {
      const task = taskById.get(round.task_id);
      const roundParticipation = participations.filter(item => item.round_id === round.id);
      const voters = getEligibleVoters(roundParticipation);
      const observers = roundParticipation.filter(item => item.participation_mode === "observer");
      const eligibleVotes = getEligibleRoundVotes(votes.filter(vote => vote.round_id === round.id), roundParticipation);
      const voteByMember = new Map(eligibleVotes.map(vote => [vote.member_id, vote]));
      const stats = calculateRoundStats(eligibleVotes.map(vote => vote.value));
      const distribution = Object.entries(stats.distribution);
      const regularVotes = distribution.filter(([value]) => Number.isFinite(Number(value)));
      const specialVotes = distribution.filter(([value]) => !Number.isFinite(Number(value)));
      const accepted = task?.finalized_from_round_id === round.id;
      const legacyEstimate = task?.status === "completed" && task.final_estimate && !task.finalized_from_round_id && newestRoundByTask.get(task.id) === round.id;
      return <article key={round.id}>
        <header><div><span>{task?.title ?? t("deletedTask")}</span><strong>{t("round", { number: round.round_number })}</strong></div><time dateTime={round.revealed_at ?? round.created_at}>{formatDateTime(round.revealed_at ?? round.created_at, locale, tCommon("unavailable"))}</time></header>
        <div className="history-metrics"><span>{t("voterProgress", { votes: eligibleVotes.length, voters: voters.length })}</span><span>{t("observers", { count: observers.length })}</span><span>{t("average")} <b>{formatStatistic(stats.average, locale, tCommon("unavailable"))}</b></span><span>{t("median")} <b>{formatStatistic(stats.median, locale, tCommon("unavailable"))}</b></span>{stats.consensus && <span className="history-consensus"><CheckCircle2 size={13} /> {t("consensus")}</span>}</div>
        <div className="history-distribution"><strong>{t("result")}</strong>{regularVotes.length ? regularVotes.map(([value, count]) => <span key={value}>{value} × {count}</span>) : <span>{t("noNumericVotes")}</span>}{specialVotes.length > 0 && <span className="special-votes"><Coffee size={12} /> {t("special", { values: specialVotes.map(([value, count]) => `${value} × ${count}`).join(" · ") })}</span>}</div>
        <div className={`history-decision ${accepted ? "accepted" : ""}`}>{accepted ? <><CheckCircle2 size={14} /><strong>{t("accepted", { estimate: task?.final_estimate ?? tCommon("unavailable") })}</strong></> : legacyEstimate ? <><strong>{t("currentEstimate", { estimate: task.final_estimate ?? tCommon("unavailable") })}</strong><small>{t("legacy")}</small></> : task?.status === "completed" ? <span>{t("notFinal")}</span> : <span>{t("pendingDecision")}</span>}</div>
        <details className="history-participants"><summary>{t("showParticipants")}</summary><div>{roundParticipation.map(item => {
          const member = memberById.get(item.member_id);
          if (!member) return null;
          const vote = voteByMember.get(item.member_id);
          return <span key={item.member_id} className={item.participation_mode === "observer" ? "history-observer" : ""}><b>{member.avatar_key} {member.display_name}</b>{item.participation_mode === "observer" ? <><Eye size={13} /> {t("observer")}</> : <em>{vote?.value ?? t("noVote")}</em>}</span>;
        })}</div></details>
      </article>;
    })}</div>
  </details>;
}
