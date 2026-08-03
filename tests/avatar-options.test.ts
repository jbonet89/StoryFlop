import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AVATARS } from "@/lib/constants";
import { avatarSchema } from "@/lib/validation";

const migration = readFileSync(new URL("../supabase/migrations/20260803060000_more_avatars.sql", import.meta.url), "utf8");
const requestedAvatars = ["🐶","🐱","🦋","🐷","🦩","🦆","🦅","🦤","🦥","🦔","🦘","🐰","🦈","🫍","🐬","🐋"];

describe("catálogo ampliado de avatares", () => {
  it("incluye los animales solicitados y los acepta en el cliente", () => {
    expect(AVATARS).toEqual(expect.arrayContaining(requestedAvatars));
    for (const avatar of requestedAvatars) expect(avatarSchema.safeParse(avatar).success).toBe(true);
  });

  it("usa la misma validación en la restricción y las RPC de Supabase", () => {
    for (const avatar of AVATARS) expect(migration).toContain(`'${avatar}'`);
    expect(migration).toContain("check (public.is_valid_avatar_key(avatar_key))");
    expect(migration.match(/not public\.is_valid_avatar_key\(p_avatar_key\)/g)).toHaveLength(2);
  });
});

