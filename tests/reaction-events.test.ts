import { describe, expect, it } from "vitest";
import { isReactionBroadcastEvent, type ReactionBroadcastEvent } from "@/lib/reaction-events";

const event = (overrides: Partial<ReactionBroadcastEvent> = {}): ReactionBroadcastEvent => ({
  eventId: "event-1", roomId: "room-1", senderMemberId: "member-1", targetMemberId: "member-2",
  emoji: "💩", scale: 1, sentAt: 10_000, ...overrides,
});

describe("eventos efímeros de reacciones", () => {
  it("acepta un payload Broadcast válido", () => expect(isReactionBroadcastEvent(event())).toBe(true));
  it("rechaza emojis y escalas manipuladas", () => {
    expect(isReactionBroadcastEvent(event({ emoji: "🚨" }))).toBe(false);
    expect(isReactionBroadcastEvent(event({ scale: 99 }))).toBe(false);
  });
});
