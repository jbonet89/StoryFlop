import { describe, expect, it } from "vitest";
import { hasDuplicateIds, moveTaskId, validateTaskDraft } from "@/lib/task-management";

describe("validación de tareas", () => {
  it("normaliza título y URL HTTP(S)", () => {
    expect(validateTaskDraft({ title: "  Historia  ", description: " Detalle ", taskUrl: " https://example.com/t/1 " }).value).toEqual({ title: "Historia", description: "Detalle", taskUrl: "https://example.com/t/1" });
  });

  it("rechaza título vacío y protocolos inseguros", () => {
    const result = validateTaskDraft({ title: " ", description: "", taskUrl: "javascript:alert(1)" });
    expect(result.errors.title).toBe("titleRequired");
    expect(result.errors.taskUrl).toBe("invalidTaskUrl");
  });
});

describe("reordenación inmutable", () => {
  it("mueve arriba, abajo, al principio y al final sin mutar el original", () => {
    const original = ["a", "b", "c", "d"];
    expect(moveTaskId(original, "c", "up")).toEqual(["a", "c", "b", "d"]);
    expect(moveTaskId(original, "b", "down")).toEqual(["a", "c", "b", "d"]);
    expect(moveTaskId(original, "c", "start")).toEqual(["c", "a", "b", "d"]);
    expect(moveTaskId(original, "b", "end")).toEqual(["a", "c", "d", "b"]);
    expect(original).toEqual(["a", "b", "c", "d"]);
  });

  it("detecta IDs duplicados", () => {
    expect(hasDuplicateIds(["a", "b", "a"])).toBe(true);
    expect(() => moveTaskId(["a", "b", "a"], "a", "end")).toThrow("DUPLICATE_TASK_IDS");
  });
});
