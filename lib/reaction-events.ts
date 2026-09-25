import { REACTIONS } from "./constants";

export const REACTION_BROADCAST_EVENT = "throw_reaction";

export interface ReactionBroadcastEvent {
  eventId: string;
  roomId: string;
  senderMemberId: string;
  targetMemberId: string;
  emoji: string;
  scale: number;
  sentAt: number;
}

export function isReactionBroadcastEvent(value: unknown): value is ReactionBroadcastEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<ReactionBroadcastEvent>;
  return typeof event.eventId === "string"
    && typeof event.roomId === "string"
    && typeof event.senderMemberId === "string"
    && typeof event.targetMemberId === "string"
    && typeof event.emoji === "string"
    && REACTIONS.some(reaction => reaction.emoji === event.emoji)
    && typeof event.scale === "number"
    && Number.isFinite(event.scale)
    && event.scale >= 1
    && event.scale <= 3
    && typeof event.sentAt === "number"
    && Number.isFinite(event.sentAt);
}
