import { DECK } from "./constants";
import type { PokerTask } from "./types";

export function getFinalEstimate(task: PokerTask) {
  if (task.status !== "completed" || task.final_estimate === null || !DECK.some(value => value === task.final_estimate)) return null;
  return { value: task.final_estimate };
}
