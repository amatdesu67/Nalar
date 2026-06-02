import type { Paper } from "@/lib/types";

export interface PaperFilters {
  openAccessOnly: boolean;
  minCitations: number;
  yearMin: number | null;
  yearMax: number | null;
  fields: string[]; // kosong = semua bidang
}

export function emptyFilters(): PaperFilters {
  return { openAccessOnly: false, minCitations: 0, yearMin: null, yearMax: null, fields: [] };
}

// Batas pilihan yang diturunkan dari kumpulan paper (untuk mengisi kontrol UI).
export interface FilterBounds {
  minYear: number | null;
  maxYear: number | null;
  maxCitations: number;
  fields: string[]; // unik, terurut
}

export function deriveBounds(papers: Paper[]): FilterBounds {
  const years = papers.map((p) => p.year).filter((y): y is number => y != null);
  const fields = Array.from(new Set(papers.map((p) => p.field).filter((f): f is string => !!f))).sort();
  return {
    minYear: years.length ? Math.min(...years) : null,
    maxYear: years.length ? Math.max(...years) : null,
    maxCitations: papers.reduce((m, p) => Math.max(m, p.citationCount), 0),
    fields,
  };
}

export function applyFilters(papers: Paper[], f: PaperFilters): Paper[] {
  return papers.filter((p) => {
    if (f.openAccessOnly && !p.isOpenAccess) return false;
    if (p.citationCount < f.minCitations) return false;
    // Paper tanpa tahun selalu lolos filter tahun (tidak menyembunyikannya).
    if (p.year != null) {
      if (f.yearMin != null && p.year < f.yearMin) return false;
      if (f.yearMax != null && p.year > f.yearMax) return false;
    }
    if (f.fields.length > 0 && !(p.field && f.fields.includes(p.field))) return false;
    return true;
  });
}

export function isActive(f: PaperFilters, bounds: FilterBounds): boolean {
  return (
    f.openAccessOnly ||
    f.minCitations > 0 ||
    f.fields.length > 0 ||
    (f.yearMin != null && f.yearMin !== bounds.minYear) ||
    (f.yearMax != null && f.yearMax !== bounds.maxYear)
  );
}
