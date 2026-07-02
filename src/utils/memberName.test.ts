import { describe, expect, it } from "vitest";
import { normalizeDisplayName, normalizeMemberName, validateComptoirName } from "./memberName";

describe("member names", () => {
  it("normalizes display names", () => {
    expect(normalizeDisplayName("  Jean-Michel   Pastaga  ")).toBe("Jean-Michel Pastaga");
  });

  it("normalizes comparable member names", () => {
    expect(normalizeMemberName("  J\u00e9r\u00e9my  D\u00e9D\u00e9  ")).toBe("jeremy dede");
  });

  it("validates comptoir names", () => {
    expect(validateComptoirName("J").ok).toBe(false);
    expect(validateComptoirName("Jean-Michel Pastaga")).toEqual({
      ok: true,
      name: "Jean-Michel Pastaga",
    });
  });
});
