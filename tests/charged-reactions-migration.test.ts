import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260803110000_charged_reactions.sql", "utf8");

describe("charged reactions migration", () => {
  it("stores a validated scale between one and three", () => {
    expect(migration).toMatch(/add column if not exists scale numeric not null default 1/);
    expect(migration).toContain("check (scale >= 1 and scale <= 3)");
    expect(migration).toContain("p_scale numeric default 1");
  });

  it("persists the scale through the authenticated reaction RPC", () => {
    expect(migration).toContain("emoji,scale");
    expect(migration).toContain("p_emoji,p_scale");
    expect(migration).toContain("grant execute on function public.send_reaction(uuid,uuid,text,numeric) to authenticated");
  });
});
