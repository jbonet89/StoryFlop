import { describe, expect, it } from "vitest";
import { calculateSeatPositions, sortMembersStable } from "@/lib/seats";
import type { Member } from "@/lib/types";

const member = (id: string, joined_at: string): Member => ({ id, joined_at, room_id:"r", user_id:`u-${id}`, display_name:id, avatar_key:"🦊", role:"participant", default_participation_mode:"voter", is_kicked:false });

describe("calculateSeatPositions", () => {
  it("coloca un jugador arriba", () => expect(calculateSeatPositions(1)[0]).toMatchObject({ xPercent:50,yPercent:5 }));
  it("coloca dos jugadores a izquierda y derecha", () => expect(calculateSeatPositions(2).map(position=>[position.xPercent,position.yPercent])).toEqual([[10,50],[90,50]]));
  it("coloca tres jugadores arriba, derecha e izquierda", () => expect(calculateSeatPositions(3).map(position=>position.xPercent)).toEqual([50,90,10]));
  it("coloca cuatro jugadores alrededor de los cuatro lados", () => expect(calculateSeatPositions(4).map(position=>[position.xPercent,position.yPercent])).toEqual([[50,5],[90,50],[50,95],[10,50]]));
  it("reparte cinco jugadores por una elipse sin NaN ni valores fuera del tablero", () => {
    const positions=calculateSeatPositions(5); expect(new Set(positions.map(position=>`${position.xPercent.toFixed(3)}:${position.yPercent.toFixed(3)}`)).size).toBe(5);
    positions.forEach(position => { expect(Number.isNaN(position.xPercent)||Number.isNaN(position.yPercent)).toBe(false); expect(position.xPercent).toBeGreaterThanOrEqual(10); expect(position.xPercent).toBeLessThanOrEqual(90); expect(position.yPercent).toBeGreaterThanOrEqual(5); expect(position.yPercent).toBeLessThanOrEqual(95); });
  });
  it("mantiene un orden estable por fecha e id sin mutar", () => { const original=[member("b","2026-01-02"),member("c","2026-01-01"),member("a","2026-01-02")]; const sorted=sortMembersStable(original); expect(sorted.map(item=>item.id)).toEqual(["c","a","b"]); expect(original.map(item=>item.id)).toEqual(["b","c","a"]); });
});
