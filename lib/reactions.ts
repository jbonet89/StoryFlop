export const MAX_REACTIONS_PER_OPEN = 5;
export const REACTION_SEND_INTERVAL_MS = 200;
export const REACTION_HOLD_THRESHOLD_MS = 400;
export const REACTION_MAX_HOLD_MS = 2500;
export const MAX_REACTION_SCALE = 3;

export function advanceReactionBurst(currentCount: number) {
  const count = Math.min(currentCount + 1, MAX_REACTIONS_PER_OPEN);
  return { count, shouldClose: count === MAX_REACTIONS_PER_OPEN };
}

export function reactionSendDelay(selectionIndex: number) {
  return Math.max(0, selectionIndex) * REACTION_SEND_INTERVAL_MS;
}

export function reactionScaleForHold(durationMs: number) {
  if (durationMs < REACTION_HOLD_THRESHOLD_MS) return 1;
  const progress = Math.min(Math.max(durationMs, 0), REACTION_MAX_HOLD_MS) / REACTION_MAX_HOLD_MS;
  return Math.min(MAX_REACTION_SCALE, 1 + progress * (MAX_REACTION_SCALE - 1));
}
