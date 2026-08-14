import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260803100000_task_deletion.sql", "utf8");

describe("task deletion migration", () => {
  it("allows only the host to delete individual tasks and compacts their order", () => {
    expect(migration).toContain("create or replace function public.delete_task");
    expect(migration).toContain("public.is_room_host(v_task.room_id)");
    expect(migration).toMatch(/delete from public\.tasks where id=p_task_id;[\s\S]*sort_order=sort_order\+v_offset[\s\S]*sort_order=sort_order-v_offset-1/);
    expect(migration).not.toContain("No se puede eliminar una tarea con resultados");
  });

  it("clears a room backlog through a host-only RPC", () => {
    expect(migration).toContain("create or replace function public.clear_backlog");
    expect(migration).toContain("public.is_room_host(p_room_id)");
    expect(migration).toContain("delete from public.tasks where room_id=p_room_id");
    expect(migration).toContain("grant execute on function public.delete_task(uuid), public.clear_backlog(uuid) to authenticated");
  });
});
