"use client";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Check, ListTodo, MoreHorizontal, Play, Plus, Trash2, X } from "lucide-react";
import type { PokerTask } from "@/lib/types";
import type { ValidatedTaskDraft } from "@/lib/task-management";
import { moveTaskId } from "@/lib/task-management";
import { getFinalEstimate } from "@/lib/tasks";
import { TaskForm } from "./TaskForm";
import type { TaskDetailMode } from "./TaskDetailDrawer";

export function TaskList({
  tasks, activeTaskId, activeControls, isHost, onCreate, onDelete, onClear, onStart, onInspect, onReorder, onClose,
}: {
  tasks: PokerTask[];
  activeTaskId?: string;
  activeControls?: ReactNode;
  isHost: boolean;
  onCreate: (draft: ValidatedTaskDraft) => Promise<boolean>;
  onDelete: (taskId: string) => void;
  onClear: () => void;
  onStart: (taskId: string) => void;
  onInspect: (task: PokerTask, mode?: TaskDetailMode) => void;
  onReorder: (taskIds: string[]) => Promise<boolean>;
  onClose?: () => void;
}) {
  const t = useTranslations("Tasks");
  const tEditor = useTranslations("TaskEditor");
  const [adding, setAdding] = useState(false);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);
  const taskIds = tasks.map(task => task.id);

  async function reorder(taskId: string, target: "up" | "down" | "start" | "end" | string) {
    const next = moveTaskId(taskIds, taskId, target);
    setMenuTaskId(null);
    if (next.every((id, index) => id === taskIds[index])) return;
    await onReorder(next);
  }

  return <aside className="task-panel"><div className="panel-heading"><div><span>{t("backlog")}</span><h2>{t("count", { count: tasks.length })}</h2></div><div className="panel-heading-actions">{isHost && <>{tasks.length > 0 && <button className="icon-button danger-icon" onClick={onClear} aria-label={t("clearBacklog")} title={t("clearBacklog")}><Trash2 size={16} /></button>}<button className="icon-button" onClick={() => setAdding(value => !value)} aria-label={t("add")}><Plus size={18} /></button></>}<button type="button" className="icon-button mobile-backlog-close" onClick={onClose} aria-label={t("closeBacklog")}><X size={18} /></button></div></div>
    {adding && <TaskForm submitLabel={tEditor("addTask")} onCancel={() => setAdding(false)} onSave={async draft => { const saved = await onCreate(draft); if (saved) setAdding(false); return saved; }} />}
    <div className="task-list">{tasks.length === 0 ? <div className="empty-tasks"><ListTodo /><strong>{t("empty")}</strong><p>{isHost ? t("emptyHost") : t("emptyGuest")}</p></div> : tasks.map((task, index) => {
      const estimate = getFinalEstimate(task);
      const completed = estimate !== null;
      const menuOpen = menuTaskId === task.id;
      const isActive = task.id === activeTaskId;
      return <article key={task.id} className={`task-item ${isActive ? "active" : ""} ${isActive && activeControls ? "has-inline-controls" : ""} ${completed ? "completed-task" : ""}`}>
        <button className="task-select" onClick={() => onInspect(task)} aria-label={t("inspect", { title: task.title })}><span className={`task-status ${task.status}`}>{completed ? <Check size={11} /> : task.sort_order + 1}</span><span className="task-copy"><strong>{task.title}</strong><small>{t(`status.${task.status}`)}</small></span>{estimate && <span className="final-estimate" aria-label={t("acceptedEstimate", { estimate: estimate.value })}><small>{t("estimate")}</small><b>{estimate.value}</b></span>}</button>
        {isHost && <div className="task-card-actions">{task.status === "pending" && <button className="vote-task-button" onClick={() => onStart(task.id)} aria-label={t("voteTaskLabel", { title: task.title })} title={t("voteTask")}><Play size={15} fill="currentColor" /></button>}<button className="task-menu-button" onClick={() => setMenuTaskId(menuOpen ? null : task.id)} aria-label={t("actions", { title: task.title })} aria-expanded={menuOpen}><MoreHorizontal size={16} /></button>{menuOpen && <div className="task-action-menu">
          <button onClick={() => { setMenuTaskId(null); onInspect(task, "edit"); }}>{t("edit")}</button>
          {task.status === "completed" && <button onClick={() => { setMenuTaskId(null); onInspect(task, "estimate"); }}>{t("editFinalEstimate")}</button>}
          {task.status === "pending" && <button onClick={() => { setMenuTaskId(null); onStart(task.id); }}>{t("voteTask")}</button>}
          <hr />
          <button disabled={index === 0} onClick={() => void reorder(task.id, "up")}>{t("moveUp")}</button>
          <button disabled={index === tasks.length - 1} onClick={() => void reorder(task.id, "down")}>{t("moveDown")}</button>
          <button disabled={index === 0} onClick={() => void reorder(task.id, "start")}>{t("moveStart")}</button>
          <button disabled={index === tasks.length - 1} onClick={() => void reorder(task.id, "end")}>{t("moveEnd")}</button>
          <hr /><button className="danger" onClick={() => { setMenuTaskId(null); onDelete(task.id); }}><Trash2 size={13} />{t("delete")}</button>
        </div>}</div>}
        {isActive && activeControls && <div className="task-inline-controls">{activeControls}</div>}
      </article>;
    })}</div>
  </aside>;
}
