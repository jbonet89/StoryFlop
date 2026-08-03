import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260803050000_leave_room_task_creator.sql", import.meta.url), "utf8");

describe("abandono de sala con tareas creadas", () => {
  it("permite liberar el creador sin eliminar la tarea", () => {
    expect(migration).toContain("alter column created_by drop not null");
    expect(migration).toMatch(/foreign key \(created_by\)[\s\S]*on delete set null/);
    expect(migration).not.toMatch(/delete from public\.tasks/);
  });

  it("reemplaza de forma idempotente la clave foránea anterior", () => {
    expect(migration).toContain("drop constraint if exists tasks_created_by_fkey");
    expect(migration).toContain("add constraint tasks_created_by_fkey");
  });
});

