import { describe, it, expect } from "vitest";
import { applyFilters, deriveBounds, emptyFilters, isActive } from "@/lib/filter-papers";
import type { Paper } from "@/lib/types";

function paper(over: Partial<Paper> = {}): Paper {
  return {
    id: "P1",
    title: "t",
    abstract: null,
    authors: [],
    year: 2020,
    venue: null,
    citationCount: 10,
    doi: null,
    url: "u",
    isOpenAccess: false,
    type: "article",
    isRetracted: false,
    field: "Medicine",
    ...over,
  };
}

const set = [
  paper({ id: "A", year: 2010, citationCount: 5, isOpenAccess: true, field: "Medicine" }),
  paper({ id: "B", year: 2020, citationCount: 100, isOpenAccess: false, field: "Biology" }),
  paper({ id: "C", year: 2024, citationCount: 0, isOpenAccess: true, field: "Physics" }),
  paper({ id: "D", year: null, citationCount: 50, isOpenAccess: false, field: null }),
];

describe("deriveBounds", () => {
  it("menghitung batas tahun, sitasi, dan bidang unik", () => {
    const b = deriveBounds(set);
    expect(b.minYear).toBe(2010);
    expect(b.maxYear).toBe(2024);
    expect(b.maxCitations).toBe(100);
    expect(b.fields).toEqual(["Biology", "Medicine", "Physics"]);
  });
});

describe("applyFilters", () => {
  it("tanpa filter mengembalikan semua", () => {
    expect(applyFilters(set, emptyFilters())).toHaveLength(4);
  });
  it("open access saja", () => {
    const r = applyFilters(set, { ...emptyFilters(), openAccessOnly: true });
    expect(r.map((p) => p.id)).toEqual(["A", "C"]);
  });
  it("minimal sitasi", () => {
    const r = applyFilters(set, { ...emptyFilters(), minCitations: 50 });
    expect(r.map((p) => p.id)).toEqual(["B", "D"]);
  });
  it("rentang tahun; paper tanpa tahun tetap lolos", () => {
    const r = applyFilters(set, { ...emptyFilters(), yearMin: 2015, yearMax: 2024 });
    expect(r.map((p) => p.id)).toEqual(["B", "C", "D"]); // D (year null) ikut
  });
  it("filter bidang ilmu", () => {
    const r = applyFilters(set, { ...emptyFilters(), fields: ["Biology", "Physics"] });
    expect(r.map((p) => p.id)).toEqual(["B", "C"]);
  });
  it("gabungan beberapa filter", () => {
    const r = applyFilters(set, { ...emptyFilters(), openAccessOnly: true, minCitations: 1 });
    expect(r.map((p) => p.id)).toEqual(["A"]);
  });
});

describe("isActive", () => {
  const bounds = deriveBounds(set);
  it("false saat semua default", () => {
    expect(isActive(emptyFilters(), bounds)).toBe(false);
  });
  it("true saat ada filter aktif", () => {
    expect(isActive({ ...emptyFilters(), openAccessOnly: true }, bounds)).toBe(true);
    expect(isActive({ ...emptyFilters(), fields: ["Biology"] }, bounds)).toBe(true);
  });
  it("rentang tahun sama dengan batas penuh dianggap tidak aktif", () => {
    expect(isActive({ ...emptyFilters(), yearMin: 2010, yearMax: 2024 }, bounds)).toBe(false);
  });
});
