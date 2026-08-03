import { describe, expect, it } from "vitest";
import { displayNameSchema, roomCodeSchema, roomNameSchema, voteSchema } from "@/lib/validation";
describe("validaciones", () => {
  it("normaliza códigos", () => expect(roomCodeSchema.parse("k7m4p9q2")).toBe("K7M4P9Q2"));
  it("rechaza caracteres ambiguos", () => expect(roomCodeSchema.safeParse("K7M4O9Q2").success).toBe(false));
  it("limita nombres", () => { expect(displayNameSchema.safeParse("A").success).toBe(false); expect(roomNameSchema.safeParse("  Sprint  ").data).toBe("Sprint"); });
  it("acepta solo la baraja", () => { expect(voteSchema.safeParse("13").success).toBe(true); expect(voteSchema.safeParse("100").success).toBe(false); });
});
