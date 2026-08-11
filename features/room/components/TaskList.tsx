"use client";
import { useState, type DragEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Check, GripVertical, ListTodo, MoreHorizontal, Play, Plus, Trash2 } from "lucide-react";
import type { PokerTask } from "@/lib/types";
import type { ValidatedTaskDraft } from "@/lib/task-management";
import { moveTaskId } from "@/lib/task-management";
import { getFinalEstimate } from "@/lib/tasks";
import { TaskForm } from "./TaskForm";
import type { TaskDetailMode } from "./TaskDetailDrawer";

export function TaskList({
  tasks, activeTaskId, activeControls, isHost, onCreate, onDelete, onStart, onInspect, onReorder,
}: {
  tasks: PokerTask[];
  activeTaskId?: string;
  activeControls?: ReactNode;
  isHost: boolean;
  onCreate: (draft: ValidatedTaskDraft) => Promise<boolean>;
  onDelete: (taskId: string) => void;
  onStart: (taskId: string) => void;
  onInspect: (task: PokerTask, mode?: TaskDetailMode) => void;
  onReorder: (taskIds: string[]) => Promise<boolean>;
}) {
  const t = useTranslations("Tasks");
  const tEditor = useTranslations("TaskEditor");
  const [adding, setAdding] = useState(false);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const taskIds = tasks.map(task => task.id);

  async function reorder(taskId: string, target: "up" | "down" | "start" | "end" | string) {
    const next = moveTaskId(taskIds, taskId, target);
    setMenuTaskId(null);
    if (next.every((id, index) => id === taskIds[index])) return;
    await onReorder(next);
  }

  function startDragging(event: DragEvent, taskId: string) {
    if (!isHost) return;
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
  }

  return <aside className="task-panel"><div className="panel-heading"><div><span>{t("backlog")}</span><h2>{t("count", { count: tasks.length })}</h2></div>{isHost && <button className="icon-button" onClick={() => setAdding(value => !value)} aria-label={t("add")}><Plus size={18} /></button>}</div>
    {adding && <TaskForm submitLabel={tEditor("addTask")} onCancel={() => setAdding(false)} onSave={async draft => { const saved = await onCreate(draft); if (saved) setAdding(false); return saved; }} />}
    <div className="task-list">{tasks.length === 0 ? <div className="empty-tasks"><ListTodo /><strong>{t("empty")}</strong><p>{isHost ? t("emptyHost") : t("emptyGuest")}</p></div> : tasks.map((task, index) => {
      const estimate = getFinalEstimate(task);
      const completed = estimate !== null;
      const menuOpen = menuTaskId === task.id;
      const isActive = task.id === activeTaskId;
      return <article key={task.id} className={`task-item ${isActive ? "active" : ""} ${isActive && activeControls ? "has-inline-controls" : ""} ${completed ? "completed-task" : ""} ${draggedTaskId === task.id ? "dragging" : ""}`} onDragOver={event => { if (draggedTaskId) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }} onDrop={event => { event.preventDefault(); const sourceId = draggedTaskId ?? event.dataTransfer.getData("text/plain"); setDraggedTaskId(null); if (sourceId && sourceId !== task.id) void reorder(sourceId, task.id); }}>
        {isHost && <button type="button" className="task-drag-handle" draggable onDragStart={event => startDragging(event, task.id)} onDragEnd={() => setDraggedTaskId(null)} aria-label={t("reorder", { title: task.title })} title={t("drag")}><GripVertical size={15} /></button>}
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
          {task.status === "pending" && <><hr /><button className="danger" onClick={() => { setMenuTaskId(null); onDelete(task.id); }}><Trash2 size={13} />{t("delete")}</button></>}
        </div>}</div>}
        {isActive && activeControls && <div className="task-inline-controls">{activeControls}</div>}
      </article>;
    })}</div>
  </aside>;
}
