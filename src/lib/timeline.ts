import type { AnalysisResult, Paper } from "@/lib/types";

export type PaperStance = "pro" | "con" | "neutral";

export interface YearBucket {
  year: number;
  pro: number;
  con: number;
  neutral: number;
  total: number;
}

export interface Timeline {
  buckets: YearBucket[]; // urut tahun menaik
  maxTotal: number; // jumlah paper terbanyak dalam satu tahun (untuk skala bar)
  span: { from: number; to: number } | null;
}

// Stance sebuah paper diturunkan dari poin bukti yang dianalisis AI:
// muncul di `supporting` → pro, di `opposing` → kontra. Bila keduanya
// (jarang) atau tidak sama sekali → netral. Paper retracted dikecualikan
// agar konsisten dengan consensus meter.
export function paperStance(result: AnalysisResult, paperId: string): PaperStance {
  const inPro = result.supporting.some((e) => e.paperIds.includes(paperId));
  const inCon = result.opposing.some((e) => e.paperIds.includes(paperId));
  if (inPro && !inCon) return "pro";
  if (inCon && !inPro) return "con";
  return "neutral";
}

export function buildTimeline(result: AnalysisResult): Timeline {
  const byYear = new Map<number, YearBucket>();

  const eligible: Paper[] = result.papers.filter((p) => !p.isRetracted && p.year != null);
  for (const p of eligible) {
    const year = p.year as number;
    const bucket =
      byYear.get(year) ?? { year, pro: 0, con: 0, neutral: 0, total: 0 };
    const stance = paperStance(result, p.id);
    bucket[stance] += 1;
    bucket.total += 1;
    byYear.set(year, bucket);
  }

  const buckets = Array.from(byYear.values()).sort((a, b) => a.year - b.year);
  const maxTotal = buckets.reduce((m, b) => Math.max(m, b.total), 0);
  const span =
    buckets.length > 0
      ? { from: buckets[0].year, to: buckets[buckets.length - 1].year }
      : null;

  return { buckets, maxTotal, span };
}
