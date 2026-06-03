import { describe, it, expect } from "vitest";
import { formatAnalysis } from "@/lib/whatsapp/format";
import type { AnalysisResult, Paper, QualityScore } from "@/lib/types";

function paper(over: Partial<Paper> = {}): Paper {
  return {
    id: "P1",
    title: "Vaccine safety study",
    abstract: "abstract",
    authors: ["Doe"],
    year: 2020,
    venue: "Journal",
    citationCount: 100,
    doi: null,
    url: "https://example.com/p1",
    isOpenAccess: true,
    type: "article",
    isRetracted: false,
    field: "Medicine",
    institutions: [],
    ...over,
  };
}
function quality(id: string, score: number): QualityScore {
  return { paperId: id, studyType: "rct", score, level: "high", peerReviewed: true, signals: [], warnings: [] };
}

function result(over: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    question: "Apakah vaksin menyebabkan autisme?",
    keywords: ["vaccine", "autism"],
    papersAnalyzed: 10,
    retractedCount: 0,
    lowEvidence: false,
    consensus: "strong_against",
    confidence: 92,
    summary: "Tidak ada bukti vaksin menyebabkan autisme.",
    eli: "",
    supporting: [],
    opposing: [{ claim: "x", strength: "strong", paperIds: ["P1", "P2"] }],
    debate: { pro: { stance: "", arguments: [], weaknesses: [] }, con: { stance: "", arguments: [], weaknesses: [] } },
    fallacies: [],
    caveats: [],
    papers: [paper({ id: "P1" }), paper({ id: "P2", title: "Second study", url: "https://example.com/p2" })],
    quality: [quality("P1", 90), quality("P2", 80)],
    ...over,
  };
}

describe("formatAnalysis", () => {
  it("memuat klaim, label konsensus, dan keyakinan", () => {
    const msg = formatAnalysis(result());
    expect(msg).toContain("Apakah vaksin menyebabkan autisme?");
    expect(msg).toContain("Bukti kuat menentang");
    expect(msg).toContain("92%");
  });

  it("menghitung paper pendukung & penentang unik", () => {
    const msg = formatAnalysis(result());
    expect(msg).toContain("2 menentang");
    expect(msg).toContain("0 mendukung");
  });

  it("mencantumkan paper teratas dengan link, urut skor", () => {
    const msg = formatAnalysis(result());
    expect(msg).toContain("https://example.com/p1");
    const i1 = msg.indexOf("https://example.com/p1");
    const i2 = msg.indexOf("https://example.com/p2");
    expect(i1).toBeLessThan(i2); // skor lebih tinggi tampil lebih dulu
  });

  it("mengecualikan paper retracted dari daftar teratas", () => {
    const r = result({
      papers: [paper({ id: "P1", isRetracted: true }), paper({ id: "P2", url: "https://example.com/p2" })],
    });
    const msg = formatAnalysis(r);
    expect(msg).not.toContain("https://example.com/p1");
    expect(msg).toContain("https://example.com/p2");
  });

  it("menyebut paper retracted yang dikecualikan", () => {
    const msg = formatAnalysis(result({ retractedCount: 3 }));
    expect(msg).toContain("3 paper ditarik");
  });

  it("memberi peringatan saat bukti terbatas", () => {
    const msg = formatAnalysis(result({ lowEvidence: true }));
    expect(msg.toLowerCase()).toContain("bukti terbatas");
  });

  it("tidak melebihi batas panjang WhatsApp", () => {
    const msg = formatAnalysis(result({ summary: "x".repeat(10000) }));
    expect(msg.length).toBeLessThanOrEqual(4000);
  });
});
