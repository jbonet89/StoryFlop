import type { Member, MemberRole } from "./types";

export function canFacilitateRoom(role: MemberRole): boolean {
  return role === "host" || role === "collaborator";
}

export function getOfflineRemovalCandidates(members: Member[], meId: string, onlineIds: ReadonlySet<string>): Member[] {
  return members.filter(member =>
    member.id !== meId && member.role !== "host" && !member.is_kicked && !onlineIds.has(member.id)
  );
}
