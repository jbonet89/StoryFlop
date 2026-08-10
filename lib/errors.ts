export const errorCodes = [
  "ROOM_NOT_FOUND", "ROOM_CLOSED", "NOT_A_ROOM_MEMBER", "HOST_ONLY",
  "OBSERVER_CANNOT_VOTE", "ROUND_NOT_OPEN", "INVALID_TASK_URL",
  "TASK_TITLE_REQUIRED", "REACTION_RATE_LIMITED", "NETWORK_ERROR",
  "COPY_FAILED", "PARTICIPATION_CHANGE_FAILED", "UNKNOWN_ERROR",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export function getErrorCode(error: unknown): ErrorCode {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const normalized = message.toLowerCase();
  if (/failed to fetch|network|conexi[oó]n|load failed/.test(normalized)) return "NETWORK_ERROR";
  if (/room_not_found|sala no existe|sala no encontrada/.test(normalized)) return "ROOM_NOT_FOUND";
  if (/room_closed|sala (está )?cerrada/.test(normalized)) return "ROOM_CLOSED";
  if (/not_a_room_member|no perteneces|ya no perteneces/.test(normalized)) return "NOT_A_ROOM_MEMBER";
  if (/host_only|acción no permitida|accion no permitida|solo.*organizador/.test(normalized)) return "HOST_ONLY";
  if (/observer_cannot_vote|observador.*vot/.test(normalized)) return "OBSERVER_CANNOT_VOTE";
  if (/round_not_open|ronda no está abierta|ronda no esta abierta|votación está cerrada/.test(normalized)) return "ROUND_NOT_OPEN";
  if (/invalid_task_url|url.*no válida|url.*no valida/.test(normalized)) return "INVALID_TASK_URL";
  if (/task_title_required|título.*obligatorio|titulo.*obligatorio/.test(normalized)) return "TASK_TITLE_REQUIRED";
  if (/reaction_rate_limited|reacciones seguidas|espera un momento antes de reaccionar/.test(normalized)) return "REACTION_RATE_LIMITED";
  return "UNKNOWN_ERROR";
}
