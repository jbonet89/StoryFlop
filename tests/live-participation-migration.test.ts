import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260803080000_live_participation_changes.sql", "utf8");

describe("live participation changes migration", () => {
  it("derives the member from auth", () => {
    expect(migration).toContain("create or replace function public.set_my_participation_mode");
    expect(migration).toContain("m.user_id = auth.uid()");
    expect(migration).not.toContain("p_member_id");
  });

  it("allows voter mode during voting and removes a vote when becoming observer", () => {
    expect(migration).toMatch(/v_round\.status = 'voting'[\s\S]*set participation_mode = 'voter'/);
    expect(migration).toMatch(/delete from public\.votes[\s\S]*set participation_mode = 'observer', has_voted = false/);
  });

  it("uses the requested mode when creating a missing round snapshot", () => {
    expect(migration).toMatch(/values \(\s*p_room_id, v_round\.id, v_member\.id, p_mode, false, null/);
  });
});
