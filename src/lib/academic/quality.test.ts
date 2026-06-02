import { describe, it, expect } from "vitest";
import { scoreQuality, scoreAll } from "@/lib/academic/quality";
import type { Paper } from "@/lib/types";

const thisYear = new Date().getFullYear();

function makePaper(overrides: Partial<Paper> = {}): Paper {
  return {
    id: "P1",
    title: "A study of things",
    abstract: "Some abstract text.",
    authors: ["Doe"],
    year: thisYear,
    venue: "Journal",
    citationCount: 10,
    doi: null,
    url: "https://example.com",
    isOpenAccess: false,
    type: "article",
    ...overrides,
  };
}

describe("classifyStudyType (via scoreQuality)", () => {
  it("mengenali meta-analysis dari judul", () => {
    expect(scoreQuality(makePaper({ title: "A meta-analysis of X" })).studyType).toBe("meta-analysis");
  });
  it("mengenali RCT", () => {
    expect(scoreQuality(makePaper({ title: "A randomized controlled trial of Y" })).studyType).toBe("rct");
  });
  it("mengenali preprint dari tipe mentah", () => {
    expect(scoreQuality(makePaper({ type: "preprint", title: "Untitled", abstract: "x" })).studyType).toBe("preprint");
  });
  it("default ke 'other' bila tak ada sinyal", () => {
    expect(scoreQuality(makePaper({ title: "Notes", abstract: "blah" })).studyType).toBe("other");
  });
});

describe("scoreQuality scoring", () => {
  it("meta-analysis lebih tinggi dari preprint", () => {
    const meta = scoreQuality(makePaper({ title: "Meta-analysis of A" }));
    const pre = scoreQuality(makePaper({ type: "preprint", title: "Preprint of A" }));
    expect(meta.score).toBeGreaterThan(pre.score);
  });
  it("skor selalu 0-100", () => {
    const high = scoreQuality(makePaper({ title: "Meta-analysis", citationCount: 100000, isOpenAccess: true, abstract: "Large trial n = 50000" }));
    expect(high.score).toBeGreaterThanOrEqual(0);
    expect(high.score).toBeLessThanOrEqual(100);
  });
  it("open access menambah skor", () => {
    const base = scoreQuality(makePaper({ isOpenAccess: false }));
    const oa = scoreQuality(makePaper({ isOpenAccess: true }));
    expect(oa.score).toBeGreaterThan(base.score);
    expect(oa.signals).toContain("Open access");
  });
  it("peringatan sitasi sangat sedikit", () => {
    expect(scoreQuality(makePaper({ citationCount: 1 })).warnings).toContain("Sitasi sangat sedikit");
  });
  it("peringatan publikasi lama", () => {
    expect(scoreQuality(makePaper({ year: thisYear - 20 })).warnings.some((w) => w.includes("cukup lama"))).toBe(true);
  });
  it("mengenali sampel besar", () => {
    expect(scoreQuality(makePaper({ abstract: "We enrolled n = 5,000 participants." })).signals.some((s) => s.includes("Sampel besar"))).toBe(true);
  });
  it("memperingatkan sampel kecil", () => {
    expect(scoreQuality(makePaper({ abstract: "Only n = 12 patients." })).warnings.some((w) => w.includes("Sampel kecil"))).toBe(true);
  });
  it("menandai peer-reviewed sesuai jenis", () => {
    expect(scoreQuality(makePaper({ title: "Meta-analysis" })).peerReviewed).toBe(true);
    expect(scoreQuality(makePaper({ type: "preprint", title: "x", abstract: "y" })).peerReviewed).toBe(false);
  });
  it("level mengikuti ambang skor", () => {
    const q = scoreQuality(makePaper());
    if (q.score >= 70) expect(q.level).toBe("high");
    else if (q.score >= 45) expect(q.level).toBe("medium");
    else expect(q.level).toBe("low");
  });
  it("peringatan bila abstrak tidak ada", () => {
    expect(scoreQuality(makePaper({ abstract: null })).warnings).toContain("Abstrak tidak tersedia");
  });
});

describe("scoreAll", () => {
  it("memetakan tiap paper ke satu skor", () => {
    const scores = scoreAll([makePaper({ id: "A" }), makePaper({ id: "B" })]);
    expect(scores).toHaveLength(2);
    expect(scores.map((s) => s.paperId)).toEqual(["A", "B"]);
  });
});
