import { describe, expect, it } from "vitest";
import { getErrorCode } from "@/lib/errors";

describe("error mapping", () => {
  it("maps the active-round database error to an actionable UI message", () => {
    expect(getErrorCode(new Error("Ya existe una ronda activa"))).toBe("ACTIVE_ROUND_EXISTS");
    expect(getErrorCode(new Error("ACTIVE_ROUND_EXISTS"))).toBe("ACTIVE_ROUND_EXISTS");
  });
});
