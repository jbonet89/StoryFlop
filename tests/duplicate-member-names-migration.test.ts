import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260803090000_duplicate_member_names.sql", "utf8");

describe("duplicate member names migration", () => {
  it("serializes joins in the same room before selecting a name", () => {
    expect(migration).toMatch(/from public\.rooms r[\s\S]*for update/);
  });

  it("adds sequential suffixes case-insensitively and excludes the current member", () => {
    expect(migration).toMatch(/while exists[\s\S]*lower\(m\.display_name\) = lower\(v_display_name\)/);
    expect(migration).toContain("m.id is distinct from v_id");
    expect(migration).toContain("v_suffix := v_suffix + 1");
  });

  it("keeps suffixed names inside the database length limit", () => {
    expect(migration).toContain("left(v_requested_name, 32 - char_length(v_suffix_text)) || v_suffix_text");
  });
});
