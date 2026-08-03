import { describe, expect, it } from "vitest";
import { unwrapRpcRow } from "@/lib/supabase/rpc";

describe("unwrapRpcRow", () => {
  it("extrae la primera fila devuelta por una función RETURNS TABLE", () => {
    expect(unwrapRpcRow([{ code: "K7M4P9Q2" }], "create_room")).toEqual({ code: "K7M4P9Q2" });
  });

  it("conserva respuestas de fila única", () => {
    expect(unwrapRpcRow({ code: "K7M4P9Q2" }, "create_room")).toEqual({ code: "K7M4P9Q2" });
  });

  it("falla de forma explícita si la RPC no devuelve filas", () => {
    expect(() => unwrapRpcRow([], "create_room")).toThrow("create_room no devolvió ningún resultado");
  });
});
