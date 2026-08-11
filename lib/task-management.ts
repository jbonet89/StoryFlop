import { normalizeHttpUrl } from "./links";

export interface TaskDraft {
  title: string;
  description: string;
  taskUrl: string;
}

export interface ValidatedTaskDraft {
  title: string;
  description: string;
  taskUrl: string | null;
}

export type TaskDraftError = "titleRequired" | "titleTooLong" | "descriptionTooLong" | "invalidTaskUrl" | "taskUrlTooLong";

export function validateTaskDraft(draft: TaskDraft): { value?: ValidatedTaskDraft; errors: Partial<Record<keyof TaskDraft, TaskDraftError>> } {
  const errors: Partial<Record<keyof TaskDraft, TaskDraftError>> = {};
  const title = draft.title.trim();
  const description = draft.description.trim();
  const rawUrl = draft.taskUrl.trim();
  if (!title) errors.title = "titleRequired";
  else if (title.length > 160) errors.title = "titleTooLong";
  if (description.length > 5000) errors.description = "descriptionTooLong";
  const taskUrl = rawUrl ? normalizeHttpUrl(rawUrl) : null;
  if (rawUrl && !taskUrl) errors.taskUrl = "invalidTaskUrl";
  if (rawUrl.length > 2048 || (taskUrl?.length ?? 0) > 2048) errors.taskUrl = "taskUrlTooLong";
  return Object.keys(errors).length ? { errors } : { value: { title, description, taskUrl }, errors };
}

export function hasDuplicateIds(ids: string[]): boolean {
  return new Set(ids).size !== ids.length;
}

export function moveTaskId(ids: string[], taskId: string, target: "up" | "down" | "start" | "end" | string): string[] {
  if (hasDuplicateIds(ids)) throw new Error("DUPLICATE_TASK_IDS");
  const from = ids.indexOf(taskId);
  if (from < 0) return [...ids];
  let to: number;
  if (target === "up") to = Math.max(0, from - 1);
  else if (target === "down") to = Math.min(ids.length - 1, from + 1);
  else if (target === "start") to = 0;
  else if (target === "end") to = ids.length - 1;
  else {
    const targetIndex = ids.indexOf(target);
    if (targetIndex < 0) return [...ids];
    to = from < targetIndex ? targetIndex - 1 : targetIndex;
  }
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
