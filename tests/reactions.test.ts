import { describe, expect, it } from "vitest";
import { REACTIONS } from "@/lib/constants";
import { advanceReactionBurst, MAX_REACTION_SCALE, MAX_REACTIONS_PER_OPEN, REACTION_HOLD_THRESHOLD_MS, REACTION_MAX_HOLD_MS, REACTION_SEND_INTERVAL_MS, reactionScaleForHold, reactionSendDelay } from "@/lib/reactions";
import { reactionSchema } from "@/lib/validation";

describe("selector simplificado de reacciones", () => {
  it("contiene una única lista de catorce emojis", () => {
    expect(REACTIONS.map(option => option.emoji)).toEqual(["😂", "🔥", "👏", "🤔", "🎯", "☕", "💩", "🫏", "🐔", "🧠", "🏆", "🐸", "🦄", "🍌"]);
  });

  it("acepta todas las reacciones visibles en la validación", () => {
    for (const { emoji } of REACTIONS) expect(reactionSchema.safeParse(emoji).success).toBe(true);
  });

  it("cierra la ráfaga exactamente después del quinto envío", () => {
    expect(MAX_REACTIONS_PER_OPEN).toBe(5);
    expect(advanceReactionBurst(3)).toEqual({ count: 4, shouldClose: false });
    expect(advanceReactionBurst(4)).toEqual({ count: 5, shouldClose: true });
    expect(advanceReactionBurst(5)).toEqual({ count: 5, shouldClose: true });
  });

  it("separa los envíos de una ráfaga por 200 ms", () => {
    expect(REACTION_SEND_INTERVAL_MS).toBe(200);
    expect([0, 1, 2, 3, 4].map(reactionSendDelay)).toEqual([0, 200, 400, 600, 800]);
  });

  it("carga una reacción larga progresivamente hasta un máximo de 3x", () => {
    expect(reactionScaleForHold(REACTION_HOLD_THRESHOLD_MS - 1)).toBe(1);
    expect(reactionScaleForHold(REACTION_MAX_HOLD_MS)).toBe(MAX_REACTION_SCALE);
    expect(reactionScaleForHold(REACTION_MAX_HOLD_MS * 2)).toBe(MAX_REACTION_SCALE);
    expect(reactionScaleForHold(1250)).toBe(2);
  });
});
