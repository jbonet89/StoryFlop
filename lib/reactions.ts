export const MAX_REACTIONS_PER_OPEN = 5;
export const REACTION_SEND_INTERVAL_MS = 200;

export function advanceReactionBurst(currentCount: number) {
  const count = Math.min(currentCount + 1, MAX_REACTIONS_PER_OPEN);
  return { count, shouldClose: count === MAX_REACTIONS_PER_OPEN };
}

export function reactionSendDelay(selectionIndex: number) {
  return Math.max(0, selectionIndex) * REACTION_SEND_INTERVAL_MS;
}
