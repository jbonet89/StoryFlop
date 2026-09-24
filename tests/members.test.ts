import { describe, expect, it } from "vitest";
import { canFacilitateRoom, getOfflineRemovalCandidates } from "@/lib/members";
import type { Member, MemberRole } from "@/lib/types";

const member = (id: string, role: MemberRole, is_kicked=false): Member => ({
  id, role, is_kicked, room_id: "room", user_id: `user-${id}`,
  display_name: id, avatar_key: "🦊", default_participation_mode: "voter",
  joined_at: "2026-01-01T00:00:00Z",
});

describe("room member permissions", () => {
  it("allows hosts and collaborators to facilitate", () => {
    expect(canFacilitateRoom("host")).toBe(true);
    expect(canFacilitateRoom("collaborator")).toBe(true);
    expect(canFacilitateRoom("participant")).toBe(false);
  });

  it("selects only removable disconnected members", () => {
    const members = [
      member("host", "host"), member("me", "collaborator"),
      member("online", "participant"), member("offline", "participant"),
      member("peer", "collaborator"), member("removed", "participant", true),
    ];
    expect(getOfflineRemovalCandidates(members, "me", new Set(["online"])).map(item => item.id))
      .toEqual(["offline", "peer"]);
  });
});
