import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260803030000_task_management_and_history.sql", import.meta.url), "utf8");
const functionSource = (name: string) => migration.match(new RegExp(`create(?: or replace)? function public\\.${name}[\\s\\S]*?end \\$\\$;`))?.[0] ?? "";

describe("contrato SQL de gestión de tareas", () => {
  it("limita edición y reordenación al organizador", () => {
    expect(functionSource("update_task")).toContain("public.is_room_host(v_task.room_id)");
    expect(functionSource("reorder_tasks")).toContain("public.is_room_host(p_room_id)");
  });

  it("rechaza duplicados y tareas de otra sala al reordenar", () => {
    const reorder = functionSource("reorder_tasks");
    expect(reorder).toContain("TASK_REORDER_DUPLICATE_IDS");
    expect(reorder).toContain("TASK_REORDER_FOREIGN_TASK");
  });

  it("la corrección final conserva votos y rondas y escribe auditoría", () => {
    const updateEstimate = functionSource("update_final_estimate");
    expect(updateEstimate).toContain("public.task_estimate_changes");
    expect(updateEstimate).not.toMatch(/update public\.(votes|rounds)|delete from public\.(votes|rounds)/);
    expect(updateEstimate).toContain("v_task.status<>'completed'");
  });

  it("solo permite lectura directa de la auditoría", () => {
    expect(migration).toContain("alter table public.task_estimate_changes enable row level security");
    expect(migration).toContain("grant select on public.task_estimate_changes to authenticated");
  });
});
