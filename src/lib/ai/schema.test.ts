import { describe, it, expect } from "vitest";
import { RawAnalysisSchema, KeywordSchema } from "@/lib/ai/schema";

describe("RawAnalysisSchema", () => {
  it("default untuk objek kosong", () => {
    const r = RawAnalysisSchema.parse({});
    expect(r.consensus).toBe("insufficient");
    expect(r.confidence).toBe(0);
    expect(r.supporting).toEqual([]);
    expect(r.debate.pro.arguments).toEqual([]);
  });
  it("clamp confidence 0-100", () => {
    expect(RawAnalysisSchema.parse({ confidence: 250 }).confidence).toBe(100);
    expect(RawAnalysisSchema.parse({ confidence: -50 }).confidence).toBe(0);
  });
  it("confidence string angka", () => {
    expect(RawAnalysisSchema.parse({ confidence: "73" }).confidence).toBe(73);
  });
  it("consensus tak dikenal -> insufficient", () => {
    expect(RawAnalysisSchema.parse({ consensus: "wibble" }).consensus).toBe("insufficient");
  });
  it("strength tak dikenal -> moderate", () => {
    const r = RawAnalysisSchema.parse({ supporting: [{ claim: "x", paperRefs: [1], strength: "ultra" }] });
    expect(r.supporting[0].strength).toBe("moderate");
  });
  it("paperRefs dipaksa numerik", () => {
    const r = RawAnalysisSchema.parse({ supporting: [{ claim: "x", paperRefs: ["1", "2"], strength: "strong" }] });
    expect(r.supporting[0].paperRefs).toEqual([1, 2]);
  });
  it("pertahankan field valid lengkap", () => {
    const r = RawAnalysisSchema.parse({
      consensus: "moderate_support",
      confidence: 60,
      summary: "ringkasan",
      eli: "penjelasan",
      supporting: [{ claim: "a", paperRefs: [1], strength: "strong" }],
      opposing: [],
      debate: {
        pro: { stance: "pro", arguments: ["x"], weaknesses: [] },
        con: { stance: "con", arguments: [], weaknesses: ["y"] },
      },
      fallacies: [{ name: "strawman", explanation: "e" }],
      caveats: ["c"],
    });
    expect(r.consensus).toBe("moderate_support");
    expect(r.supporting[0].claim).toBe("a");
    expect(r.fallacies[0].name).toBe("strawman");
  });
});

describe("KeywordSchema", () => {
  it("default string kosong", () => {
    const r = KeywordSchema.parse({});
    expect(r.keywords).toBe("");
    expect(r.claim).toBe("");
  });
  it("pertahankan nilai valid", () => {
    expect(KeywordSchema.parse({ keywords: "kopi sehat", claim: "kopi sehat" }).keywords).toBe("kopi sehat");
  });
});
