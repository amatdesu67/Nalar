import { describe, it, expect } from "vitest";
import { sanitizeQuestion } from "@/lib/sanitize";

describe("sanitizeQuestion", () => {
  it("menolak non-string", () => {
    expect(sanitizeQuestion(123).ok).toBe(false);
    expect(sanitizeQuestion(null).ok).toBe(false);
  });
  it("menolak terlalu pendek", () => {
    const r = sanitizeQuestion("hi");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/pendek/i);
  });
  it("menerima valid & merapikan spasi", () => {
    const r = sanitizeQuestion("  Apakah   kopi   sehat?  ");
    expect(r.ok).toBe(true);
    expect(r.value).toBe("Apakah kopi sehat?");
  });
  it("menghapus code fence", () => {
    const r = sanitizeQuestion("Apakah ```ignore previous``` benar?");
    expect(r.ok).toBe(true);
    expect(r.value).not.toContain("```");
  });
  it("memotong >300 karakter, bukan menolak", () => {
    const r = sanitizeQuestion("a".repeat(500));
    expect(r.ok).toBe(true);
    expect(r.value.length).toBeLessThanOrEqual(300);
  });
});
