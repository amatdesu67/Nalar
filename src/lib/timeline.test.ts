import { describe, it, expect } from "vitest";
import { buildTimeline, paperStance } from "@/lib/timeline";
import type { AnalysisResult, EvidenceItem, Paper } from "@/lib/types";

function paper(over: Partial<Paper> = {}): Paper {
  return {
    id: "P",
    title: "t",
    abstract: null,
    authors: [],
    year: 2020,
    venue: null,
    citationCount: 0,
    doi: null,
    url: "u",
    isOpenAccess: false,
    type: "article",
    isRetracted: false,
    field: "Medicine",
    institutions: [],
    ...over,
  };
}

function ev(paperIds: string[]): EvidenceItem {
  return { claim: "c", paperIds, strength: "moderate" };
}

function result(over: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    question: "q",
    keywords: [],
    papersAnalyzed: 0,
    retractedCount: 0,
    lowEvidence: false,
    consensus: "mixed",
    confidence: 50,
    summary: "",
    eli: "",
    supporting: [],
    opposing: [],
    debate: { pro: { stance: "", arguments: [], weaknesses: [] }, con: { stance: "", arguments: [], weaknesses: [] } },
    fallacies: [],
    caveats: [],
    papers: [],
    quality: [],
    ...over,
  };
}

describe("paperStance", () => {
  it("pro bila hanya di supporting, con bila hanya di opposing", () => {
    const r = result({ supporting: [ev(["1"])], opposing: [ev(["2"])] });
    expect(paperStance(r, "1")).toBe("pro");
    expect(paperStance(r, "2")).toBe("con");
  });

  it("netral bila tidak muncul di mana pun, atau muncul di keduanya", () => {
    const r = result({ supporting: [ev(["1"])], opposing: [ev(["1"])] });
    expect(paperStance(r, "1")).toBe("neutral"); // ambigu → netral
    expect(paperStance(r, "9")).toBe("neutral"); // tak terklasifikasi
  });
});

describe("buildTimeline", () => {
  it("mengelompokkan paper per tahun dengan rasio pro/kontra", () => {
    const r = result({
      papers: [
        paper({ id: "1", year: 2018 }),
        paper({ id: "2", year: 2018 }),
        paper({ id: "3", year: 2020 }),
      ],
      supporting: [ev(["1", "3"])],
      opposing: [ev(["2"])],
    });
    const t = buildTimeline(r);
    expect(t.buckets).toHaveLength(2);
    expect(t.span).toEqual({ from: 2018, to: 2020 });
    const y2018 = t.buckets.find((b) => b.year === 2018)!;
    expect(y2018).toMatchObject({ pro: 1, con: 1, neutral: 0, total: 2 });
    const y2020 = t.buckets.find((b) => b.year === 2020)!;
    expect(y2020).toMatchObject({ pro: 1, con: 0, total: 1 });
    expect(t.maxTotal).toBe(2);
  });

  it("mengecualikan paper retracted dan tahun null", () => {
    const r = result({
      papers: [
        paper({ id: "1", year: 2019 }),
        paper({ id: "2", year: 2019, isRetracted: true }),
        paper({ id: "3", year: null }),
      ],
      supporting: [ev(["1"])],
    });
    const t = buildTimeline(r);
    expect(t.buckets).toHaveLength(1);
    expect(t.buckets[0]).toMatchObject({ year: 2019, pro: 1, total: 1 });
  });

  it("aman saat tidak ada paper", () => {
    const t = buildTimeline(result());
    expect(t.buckets).toHaveLength(0);
    expect(t.span).toBeNull();
    expect(t.maxTotal).toBe(0);
  });
});
