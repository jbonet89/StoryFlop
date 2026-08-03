"use client";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Pencil, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DECK } from "@/lib/constants";
import { getEligibleRoundVotes, getEligibleVoters } from "@/lib/participation";
import { getUrlDomain, normalizeHttpUrl } from "@/lib/links";
import { calculateRoundStats, formatStatistic } from "@/lib/statistics";
import { formatDateTime } from "@/lib/formatting";
import type { Participation, PokerTask, Round, TaskEstimateChange, Vote } from "@/lib/types";
import type { ValidatedTaskDraft } from "@/lib/task-management";
import { LinkedText } from "./LinkedText";
import { TaskForm } from "./TaskForm";

export type TaskDetailMode = "view" | "edit" | "estimate";

export function TaskDetailDrawer({
  task, rounds, participations, votes, estimateChanges, isHost, initialMode, onClose, onSave, onUpdateEstimate,
}: {
  task: PokerTask;
  rounds: Round[];
  participations: Participation[];
  votes: Vote[];
  estimateChanges: TaskEstimateChange[];
  isHost: boolean;
  initialMode: TaskDetailMode;
  onClose: () => void;
  onSave: (draft: ValidatedTaskDraft) => Promise<boolean>;
  onUpdateEstimate: (estimate: string) => Promise<boolean>;
}) {
  const t = useTranslations("TaskDetails");
  const tEditor = useTranslations("TaskEditor");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const [mode, setMode] = useState<TaskDetailMode>(initialMode);
  const [estimate, setEstimate] = useState(task.final_estimate ?? "");
  const [confirmingEstimate, setConfirmingEstimate] = useState(false);
  const taskRounds = useMemo(() => rounds.filter(round => round.task_id === task.id && (round.status === "revealed" || round.status === "closed")), [rounds, task.id]);
  const taskChanges = estimateChanges.filter(change => change.task_id === task.id);
  const specificUrl = task.task_url ? normalizeHttpUrl(task.task_url) : null;

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function updateEstimate() {
    if (!estimate || estimate === task.final_estimate) return;
    const saved = await onUpdateEstimate(estimate);
    if (saved) { setConfirmingEstimate(false); setMode("view"); }
  }

  return <div className="task-drawer-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="task-drawer" role="dialog" aria-modal="true" aria-labelledby="task-detail-title">
      <header><div><span>{t("title")}</span><h2 id="task-detail-title">{task.title}</h2></div><button className="icon-button" autoFocus={mode !== "edit"} onClick={onClose} aria-label={t("close")}><X size={18} /></button></header>
      {mode === "edit" && isHost ? <TaskForm task={task} submitLabel={tEditor("saveChanges")} onSave={async draft => { const saved = await onSave(draft); if (saved) setMode("view"); return saved; }} onCancel={() => setMode("view")} /> : mode === "estimate" && isHost && task.status === "completed" ? <section className="estimate-editor">
        <h3>{t("editFinal")}</h3>
        <p>{t("currentEstimate", { estimate: task.final_estimate ?? t("noEstimate") })}</p>
        <label htmlFor="new-final-estimate">{t("newEstimate")}</label>
        <select id="new-final-estimate" autoFocus value={estimate} onChange={event => { setEstimate(event.target.value); setConfirmingEstimate(false); }}><option value="">{tCommon("choose")}</option>{DECK.map(value => <option key={value}>{value}</option>)}</select>
        {!confirmingEstimate ? <div className="task-editor-actions"><button className="soft-button" onClick={() => setMode("view")}>{tCommon("cancel")}</button><button className="reveal-button" disabled={!estimate || estimate === task.final_estimate} onClick={() => setConfirmingEstimate(true)}>{tCommon("save")}</button></div> : <div className="estimate-confirmation" role="alert"><strong>{t("estimateChange", { previous: task.final_estimate ?? t("noEstimate"), next: estimate })}</strong><p>{t("preserveRounds")}</p><div><button className="soft-button" onClick={() => setConfirmingEstimate(false)}>{tCommon("cancel")}</button><button className="reveal-button" onClick={() => void updateEstimate()}>{t("updateEstimate")}</button></div></div>}
      </section> : <div className="task-detail-content">
        <div className="task-detail-status"><span className={`task-status ${task.status}`}><FileText size={12} /></span><strong>{t(`status.${task.status}`)}</strong>{task.final_estimate && <span className="detail-estimate">{t("finalEstimate")} <b>{task.final_estimate}</b></span>}</div>
        <section><h3>{t("description")}</h3>{task.description ? <p className="task-description"><LinkedText text={task.description} /></p> : <p className="empty-detail">{t("noDescription")}</p>}</section>
        {specificUrl && <a className="task-external-link" href={specificUrl} target="_blank" rel="noopener noreferrer"><span>{t("openDomain", { domain: getUrlDomain(specificUrl) })}</span><ExternalLink size={15} /></a>}
        <section><h3>{t("roundSummary")}</h3>{taskRounds.length ? <div className="task-round-list">{taskRounds.map(round => {
          const roundParticipation = participations.filter(item => item.round_id === round.id);
          const eligibleVotes = getEligibleRoundVotes(votes.filter(vote => vote.round_id === round.id), roundParticipation);
          const stats = calculateRoundStats(eligibleVotes.map(vote => vote.value));
          return <article key={round.id}><strong>{t("round", { number: round.round_number })}</strong><span>{t("roundMetrics", { votes: eligibleVotes.length, voters: getEligibleVoters(roundParticipation).length, average: formatStatistic(stats.average, locale, tCommon("unavailable")), median: formatStatistic(stats.median, locale, tCommon("unavailable")) })}</span>{task.finalized_from_round_id === round.id && <b>{t("acceptedRound")}</b>}</article>;
        })}</div> : <p className="empty-detail">{t("notVoted")}</p>}</section>
        {taskChanges.length > 0 && <section><h3>{t("estimateChanges")}</h3><div className="estimate-audit">{taskChanges.map(change => { const changeLabel = change.previous_estimate ? t("estimateCorrected", { previous: change.previous_estimate, next: change.new_estimate }) : t("estimateSet", { estimate: change.new_estimate }); return <p key={change.id}>{t("auditBy", { change: changeLabel, name: change.changed_by_name, date: formatDateTime(change.changed_at, locale, tCommon("unavailable")) })}</p>; })}</div></section>}
        {isHost && <div className="detail-host-actions"><button className="soft-button" onClick={() => setMode("edit")}><Pencil size={14} />{t("editTask")}</button>{task.status === "completed" && <button className="soft-button" onClick={() => setMode("estimate")}>{t("editFinal")}</button>}</div>}
      </div>}
    </aside>
  </div>;
}
