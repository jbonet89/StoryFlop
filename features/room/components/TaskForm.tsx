"use client";
import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { PokerTask } from "@/lib/types";
import { validateTaskDraft, type TaskDraftError, type ValidatedTaskDraft } from "@/lib/task-management";

export function TaskForm({ task, submitLabel, onSave, onCancel }: { task?: PokerTask; submitLabel: string; onSave: (draft: ValidatedTaskDraft) => Promise<boolean>; onCancel: () => void }) {
  const t = useTranslations("TaskEditor");
  const tValidation = useTranslations("Validation");
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [taskUrl, setTaskUrl] = useState(task?.task_url ?? "");
  const [errors, setErrors] = useState<Partial<Record<"title" | "description" | "taskUrl", TaskDraftError>>>({});
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const validation = validateTaskDraft({ title, description, taskUrl });
    setErrors(validation.errors);
    if (!validation.value) return;
    setSaving(true);
    const saved = await onSave(validation.value);
    setSaving(false);
    if (!saved) return;
  }

  return <form className="task-editor" onSubmit={submit} noValidate>
    <label htmlFor={`task-title-${task?.id ?? "new"}`}>{t("title")}</label>
    <input id={`task-title-${task?.id ?? "new"}`} autoFocus value={title} onChange={event => setTitle(event.target.value)} maxLength={160} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "task-title-error" : undefined} />
    {errors.title && <span className="field-error" id="task-title-error">{tValidation(errors.title)}</span>}
    <label htmlFor={`task-description-${task?.id ?? "new"}`}>{t("description")}</label>
    <textarea id={`task-description-${task?.id ?? "new"}`} value={description} onChange={event => setDescription(event.target.value)} maxLength={5000} rows={6} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "task-description-error" : undefined} />
    {errors.description && <span className="field-error" id="task-description-error">{tValidation(errors.description)}</span>}
    <label htmlFor={`task-url-${task?.id ?? "new"}`}>{t("url")}</label>
    <input id={`task-url-${task?.id ?? "new"}`} type="url" inputMode="url" placeholder="https://…" value={taskUrl} onChange={event => setTaskUrl(event.target.value)} maxLength={2048} aria-invalid={Boolean(errors.taskUrl)} aria-describedby={errors.taskUrl ? "task-url-error" : undefined} />
    {errors.taskUrl && <span className="field-error" id="task-url-error">{tValidation(errors.taskUrl)}</span>}
    <div className="task-editor-actions"><button type="button" className="soft-button" onClick={onCancel} disabled={saving}>{t("cancel")}</button><button className="reveal-button" disabled={saving}>{saving ? t("saving") : submitLabel}</button></div>
  </form>;
}
