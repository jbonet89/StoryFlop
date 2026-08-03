import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260803020000_participation_modes.sql", import.meta.url), "utf8");

describe("contrato SQL del modo de participación", () => {
  it("deriva siempre la identidad desde auth.uid y no acepta member_id", () => {
    const rpc = migration.match(/create or replace function public\.set_my_participation_mode[\s\S]*?end \$\$;/)?.[0] ?? "";
    expect(rpc).toContain("m.user_id=auth.uid()");
    expect(rpc).not.toMatch(/p_member_id/);
  });

  it("el cambio a observador elimina el voto y limpia la participación en la misma RPC", () => {
    const rpc = migration.match(/create or replace function public\.set_my_participation_mode[\s\S]*?end \$\$;/)?.[0] ?? "";
    expect(rpc).toMatch(/delete from public\.votes[\s\S]*set participation_mode='observer', has_voted=false, voted_at=null/);
  });

  it("cast_vote rechaza observadores en PostgreSQL", () => {
    const castVote = migration.match(/create or replace function public\.cast_vote[\s\S]*?end \$\$;/)?.[0] ?? "";
    expect(castVote).toContain("OBSERVER_CANNOT_VOTE");
    expect(castVote).toContain("v_participation.participation_mode<>'voter'");
  });

  it("inicio y reinicio copian la preferencia de todos los miembros válidos", () => {
    expect(migration.match(/m\.default_participation_mode/g)?.length).toBeGreaterThanOrEqual(4);
    expect(migration).toContain("where m.room_id=v_task.room_id and not m.is_kicked");
    expect(migration).toContain("where m.room_id=v_round.room_id and not m.is_kicked");
  });
});
