import { describe, it, expect } from "vitest";
import { toBibTeX, toAPA, toMLA, citationKey, toBibTeXAll } from "@/lib/cite";
import type { Paper } from "@/lib/types";

function paper(over: Partial<Paper> = {}): Paper {
  return {
    id: "P1",
    title: "Effects of coffee on health",
    abstract: "abstract",
    authors: ["John Doe", "Jane Smith"],
    year: 2020,
    venue: "Journal of Nutrition",
    citationCount: 50,
    doi: "10.1234/abc",
    url: "https://example.com/p1",
    isOpenAccess: true,
    type: "article",
    isRetracted: false,
    ...over,
  };
}

describe("citationKey", () => {
  it("namakeluarga + tahun", () => {
    expect(citationKey(paper())).toBe("doe2020");
  });
  it("fallback bila tanpa penulis/tahun", () => {
    expect(citationKey(paper({ authors: [], year: null }))).toBe("anonnd");
  });
});

describe("toBibTeX", () => {
  it("memuat field inti + key", () => {
    const b = toBibTeX(paper());
    expect(b).toContain("@article{doe2020,");
    expect(b).toContain("title = {Effects of coffee on health}");
    expect(b).toContain("author = {John Doe and Jane Smith}");
    expect(b).toContain("year = {2020}");
    expect(b).toContain("doi = {10.1234/abc}");
  });
  it("melewati field kosong", () => {
    const b = toBibTeX(paper({ doi: null, venue: null }));
    expect(b).not.toContain("doi =");
    expect(b).not.toContain("journal =");
  });
});

describe("toAPA", () => {
  it("format penulis, tahun, judul, DOI", () => {
    const a = toAPA(paper());
    expect(a).toContain("Doe, J.");
    expect(a).toContain("& Smith, J.");
    expect(a).toContain("(2020).");
    expect(a).toContain("https://doi.org/10.1234/abc");
  });
  it("pakai (n.d.) bila tahun kosong", () => {
    expect(toAPA(paper({ year: null }))).toContain("(n.d.)");
  });
});

describe("toMLA", () => {
  it("penulis tunggal: Last, First", () => {
    expect(toMLA(paper({ authors: ["John Doe"] }))).toContain("Doe, John.");
  });
  it("banyak penulis: et al", () => {
    expect(toMLA(paper())).toContain("et al");
  });
  it("judul dalam kutip + doi", () => {
    const m = toMLA(paper());
    expect(m).toContain('"Effects of coffee on health."');
    expect(m).toContain("doi:10.1234/abc");
  });
});

describe("toBibTeXAll", () => {
  it("menggabung semua paper", () => {
    const all = toBibTeXAll([paper({ id: "A" }), paper({ id: "B", authors: ["Alan Turing"] })]);
    expect(all).toContain("doe2020");
    expect(all).toContain("turing2020");
    expect(all.split("@article").length - 1).toBe(2);
  });
});
