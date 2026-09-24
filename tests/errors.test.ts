import { describe, expect, it } from "vitest";
import { getErrorCode } from "@/lib/errors";

describe("error mapping", () => {
  it("maps the active-round database error to an actionable UI message", () => {
    expect(getErrorCode(new Error("Ya existe una ronda activa"))).toBe("ACTIVE_ROUND_EXISTS");
    expect(getErrorCode(new Error("ACTIVE_ROUND_EXISTS"))).toBe("ACTIVE_ROUND_EXISTS");
  });

  it("distinguishes facilitation and room-governance failures", () => {
    expect(getErrorCode(new Error("FACILITATOR_ONLY"))).toBe("FACILITATOR_ONLY");
    expect(getErrorCode(new Error("HOST_PROTECTED"))).toBe("HOST_PROTECTED");
    expect(getErrorCode(new Error("MEMBER_REMOVE_NOT_ALLOWED"))).toBe("MEMBER_REMOVE_NOT_ALLOWED");
    expect(getErrorCode(new Error("MEMBER_ROLE_INVALID"))).toBe("MEMBER_ROLE_INVALID");
  });
});
