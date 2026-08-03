import type { Member, Participation, Reaction, Vote } from "./types";
import { sortMembersStable } from "./seats";

export function upsertMember(current: Member[], incoming: Member) {
  const found = current.some(member => member.id === incoming.id);
  return sortMembersStable(found ? current.map(member => member.id === incoming.id ? incoming : member) : [...current, incoming]);
}

export function removeMember(current: Member[], memberId: string) {
  return current.filter(member => member.id !== memberId);
}

export function upsertParticipation(current: Participation[], incoming: Participation) {
  const found = current.some(item => item.round_id === incoming.round_id && item.member_id === incoming.member_id);
  return found
    ? current.map(item => item.round_id === incoming.round_id && item.member_id === incoming.member_id ? incoming : item)
    : [...current, incoming];
}

export function removeParticipation(current: Participation[], incoming: Pick<Participation, "round_id" | "member_id">) {
  return current.filter(item => item.round_id !== incoming.round_id || item.member_id !== incoming.member_id);
}

export function upsertVote(current: Vote[], incoming: Vote) {
  const found = current.some(vote => vote.id === incoming.id || (vote.round_id === incoming.round_id && vote.member_id === incoming.member_id));
  return found
    ? current.map(vote => vote.id === incoming.id || (vote.round_id === incoming.round_id && vote.member_id === incoming.member_id) ? incoming : vote)
    : [...current, incoming];
}

export function removeVote(current: Vote[], incoming: Pick<Vote, "id" | "round_id" | "member_id">) {
  return current.filter(vote => vote.id !== incoming.id && (vote.round_id !== incoming.round_id || vote.member_id !== incoming.member_id));
}

export function isRecentReaction(reaction: Reaction, now = Date.now(), maxAgeMs = 15_000) {
  return now - new Date(reaction.created_at).getTime() <= maxAgeMs;
}

export function mergeReaction(current: Reaction[], incoming: Reaction, now = Date.now()) {
  if (!isRecentReaction(incoming, now) || current.some(reaction => reaction.id === incoming.id)) return current;
  return [...current.filter(reaction => isRecentReaction(reaction, now)), incoming].slice(-50);
}

export function resolveReaction(reaction: Reaction, members: Member[]) {
  const sender = members.find(member => member.id === reaction.sender_member_id);
  const target = members.find(member => member.id === reaction.target_member_id);
  return sender && target ? { sender, target } : null;
}

export function removeReactionAnimation<T extends { eventId: string }>(current: T[], eventId: string) {
  return current.filter(animation => animation.eventId !== eventId);
}
