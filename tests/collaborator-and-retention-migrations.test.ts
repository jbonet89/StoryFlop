import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const roleMigration = readFileSync(new URL("../supabase/migrations/20260803120000_collaborator_role.sql", import.meta.url), "utf8");
const permissions = readFileSync(new URL("../supabase/migrations/20260803130000_collaborator_permissions_and_member_removal.sql", import.meta.url), "utf8");
const retention = readFileSync(new URL("../supabase/migrations/20260803140000_activity_retention_and_cron.sql", import.meta.url), "utf8");

describe("collaborator and member removal migrations", () => {
  it("commits the collaborator enum before using it", () => {
    expect(roleMigration).toContain("add value if not exists 'collaborator'");
    expect(permissions).toContain("public.is_room_facilitator");
  });

  it("keeps governance host-only and operations facilitator-only", () => {
    expect(permissions).toContain("if not public.is_room_host(p_room_id) then raise exception 'HOST_ONLY'");
    expect(permissions).toContain("if not public.is_room_facilitator(p_room_id)");
    expect(permissions).not.toMatch(/create or replace function public\.(transfer_host|close_room)/);
  });

  it("protects history while clearing an open vote", () => {
    expect(permissions).toContain("set is_kicked=true, role='participant'");
    expect(permissions).toContain("r.status='voting'");
    expect(permissions).not.toMatch(/delete from public\.room_members/);
    expect(permissions).toContain("is_kicked=false");
  });
});

describe("retention migration", () => {
  it("tracks functional activity without reactions", () => {
    expect(retention).toContain("last_activity_at");
    expect(retention).not.toContain("reactions_touch_room_activity");
  });

  it("defines all idempotently named cleanup jobs", () => {
    expect(retention).toContain("storyflop-purge-reactions");
    expect(retention).toContain("storyflop-purge-rooms");
    expect(retention).toContain("storyflop-purge-anonymous-users");
    expect(retention).toContain("storyflop-purge-cron-history");
    expect(retention).toContain("interval '15 minutes'");
    expect(retention).toContain("interval '14 days'");
    expect(retention).toContain("r.owner_user_id=u.id");
  });
});
