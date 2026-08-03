import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260803070000_member_profiles.sql", "utf8");

describe("member profile migration", () => {
  it("updates only the authenticated member in the requested room", () => {
    expect(migration).toContain("create or replace function public.update_my_profile");
    expect(migration).toContain("and user_id = auth.uid()");
    expect(migration).toContain("and not is_kicked");
  });

  it("validates fields and restricts execution", () => {
    expect(migration).toContain("char_length(btrim(p_display_name)) not between 2 and 32");
    expect(migration).toContain("public.is_valid_avatar_key(p_avatar_key)");
    expect(migration).toContain("grant execute on function public.update_my_profile(uuid,text,text) to authenticated");
  });
});
