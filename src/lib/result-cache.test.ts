import { describe, it, expect, beforeEach } from "vitest";
import { readCache, writeCache, normalizeKey } from "@/lib/result-cache";
import type { AnalysisResult } from "@/lib/types";

function fakeStore(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() {
      return m.size;
    },
  } as Storage;
}

function result(q: string): AnalysisResult {
  return {
    question: q, keywords: [], papersAnalyzed: 1, retractedCount: 0, lowEvidence: false,
    consensus: "mixed", confidence: 50, summary: "s", eli: "", supporting: [], opposing: [],
    debate: { pro: { stance: "", arguments: [], weaknesses: [] }, con: { stance: "", arguments: [], weaknesses: [] } },
    fallacies: [], caveats: [], papers: [], quality: [],
  };
}

const DAY = 1000 * 60 * 60 * 24;

describe("result-cache", () => {
  let store: Storage;
  beforeEach(() => {
    store = fakeStore();
  });

  it("normalisasi kunci tidak peka huruf besar/spasi", () => {
    expect(normalizeKey("  Kopi  SEHAT ")).toBe("kopi sehat");
  });

  it("menyimpan & membaca hasil sebagai fresh", () => {
    writeCache("Kopi sehat?", result("Kopi sehat?"), 1000, store);
    const hit = readCache("kopi  sehat?", 1000, store);
    expect(hit?.result.summary).toBe("s");
    expect(hit?.stale).toBe(false);
  });

  it("menandai stale setelah lewat 24 jam", () => {
    writeCache("q panjang", result("q panjang"), 0, store);
    const hit = readCache("q panjang", DAY + 1, store);
    expect(hit?.stale).toBe(true);
  });

  it("mengembalikan null untuk yang tak tersimpan", () => {
    expect(readCache("belum ada", 0, store)).toBeNull();
  });

  it("menimpa entri lama untuk kunci yang sama (tanpa duplikat)", () => {
    writeCache("sama", result("v1"), 1, store);
    writeCache("sama", result("v2"), 2, store);
    const hit = readCache("sama", 2, store);
    expect(hit?.result.question).toBe("v2");
  });
});
