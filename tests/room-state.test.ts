import { describe, expect, it } from "vitest";
import { mergeReaction, removeMember, removeReactionAnimation, resolveReaction, upsertMember } from "@/lib/room-state";
import type { Member, Reaction } from "@/lib/types";

const member = (id: string, name=id, joined_at="2026-01-01T00:00:00Z"): Member => ({ id, joined_at, room_id:"room", user_id:`user-${id}`, display_name:name, avatar_key:"🦊", role:"participant", default_participation_mode:"voter", is_kicked:false });
const reaction = (id: string, created_at=new Date().toISOString()): Reaction => ({ id, created_at, room_id:"room",sender_member_id:"a",target_member_id:"b",emoji:"💩" });

describe("estado inmutable de miembros", () => {
  it("inserta, actualiza sin duplicar y no muta el original", () => { const original=[member("a","Ana")]; const inserted=upsertMember(original,member("b","Berta")); const updated=upsertMember(inserted,member("b","Bea")); expect(updated.map(item=>item.display_name)).toEqual(["Ana","Bea"]); expect(original).toHaveLength(1); expect(updated).not.toBe(inserted); });
  it("elimina un miembro sin mutar", () => { const original=[member("a"),member("b")]; expect(removeMember(original,"a").map(item=>item.id)).toEqual(["b"]); expect(original).toHaveLength(2); });
});

describe("reacciones", () => {
  it("deduplica event_id y acepta eventos distintos", () => { const first=reaction("one"); const once=mergeReaction([],first); expect(mergeReaction(once,first)).toBe(once); expect(mergeReaction(once,reaction("two"))).toHaveLength(2); });
  it("ignora reacciones antiguas", () => expect(mergeReaction([],reaction("old","2020-01-01T00:00:00Z"))).toEqual([]));
  it("resuelve emisor y receptor", () => { const resolved=resolveReaction(reaction("one"),[member("a","Ana"),member("b","Berto")]); expect(resolved?.sender.display_name).toBe("Ana"); expect(resolved?.target.display_name).toBe("Berto"); });
  it("elimina una animación terminada", () => expect(removeReactionAnimation([{eventId:"one"},{eventId:"two"}],"one")).toEqual([{eventId:"two"}]));
});
