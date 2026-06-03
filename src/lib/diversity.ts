import type { Paper } from "@/lib/types";

export interface TopSource {
  name: string;
  paperCount: number; // jumlah paper yang melibatkan sumber ini
  share: number; // 0..1 terhadap total paper (yang punya data terkait)
}

export interface DiversityReport {
  totalPapers: number;
  uniqueAuthors: number;
  uniqueInstitutions: number;
  topAuthor: TopSource | null;
  topInstitution: TopSource | null;
  concentrated: boolean; // true bila satu sumber mendominasi
  note: string | null; // peringatan siap-tampil (null bila aman)
}

// Ambang dominasi: satu sumber muncul di >= 60% paper (dan minimal 3 paper),
// kita anggap bukti kurang beragam.
const SHARE_THRESHOLD = 0.6;
const MIN_PAPERS = 3;

function topByPresence(papers: Paper[], pick: (p: Paper) => string[]): { unique: number; top: TopSource | null } {
  const count = new Map<string, number>();
  let papersWithData = 0;
  for (const p of papers) {
    const names = Array.from(new Set(pick(p))); // unik per paper
    if (names.length > 0) papersWithData += 1;
    for (const n of names) count.set(n, (count.get(n) ?? 0) + 1);
  }
  if (count.size === 0) return { unique: 0, top: null };
  let topName = "";
  let topCount = 0;
  for (const [n, c] of count) {
    if (c > topCount) {
      topName = n;
      topCount = c;
    }
  }
  const denom = papersWithData || papers.length;
  return {
    unique: count.size,
    top: { name: topName, paperCount: topCount, share: topCount / denom },
  };
}

export function analyzeDiversity(papers: Paper[]): DiversityReport {
  const authors = topByPresence(papers, (p) => p.authors);
  const institutions = topByPresence(papers, (p) => p.institutions);

  const dominantAuthor =
    authors.top && papers.length >= MIN_PAPERS && authors.top.share >= SHARE_THRESHOLD ? authors.top : null;
  const dominantInst =
    institutions.top && papers.length >= MIN_PAPERS && institutions.top.share >= SHARE_THRESHOLD
      ? institutions.top
      : null;

  const concentrated = !!(dominantAuthor || dominantInst);

  let note: string | null = null;
  if (concentrated) {
    const parts: string[] = [];
    if (dominantInst)
      parts.push(`institusi "${dominantInst.name}" (${Math.round(dominantInst.share * 100)}% paper)`);
    if (dominantAuthor)
      parts.push(`penulis "${dominantAuthor.name}" (${Math.round(dominantAuthor.share * 100)}% paper)`);
    note = `Sebagian besar bukti berasal dari ${parts.join(" dan ")}. Pertimbangkan keterbatasan ini — temuan dari sumber yang sama belum tentu mewakili konsensus luas.`;
  }

  return {
    totalPapers: papers.length,
    uniqueAuthors: authors.unique,
    uniqueInstitutions: institutions.unique,
    topAuthor: authors.top,
    topInstitution: institutions.top,
    concentrated,
    note,
  };
}
