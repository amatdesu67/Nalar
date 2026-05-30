import type { Paper, QualityScore, StudyType } from "@/lib/types";

// Klasifikasi jenis studi dari judul + abstrak + tipe OpenAlex.
function classifyStudyType(p: Paper): StudyType {
  const t = `${p.title} ${p.abstract ?? ""}`.toLowerCase();
  const raw = (p.type ?? "").toLowerCase();
  if (/meta[-\s]?analysis/.test(t)) return "meta-analysis";
  if (/systematic review/.test(t)) return "systematic-review";
  if (/randomi[sz]ed controlled trial|\brct\b|double[-\s]?blind/.test(t)) return "rct";
  if (/cohort study|prospective cohort|longitudinal/.test(t)) return "cohort";
  if (/case[-\s]?control/.test(t)) return "case-control";
  if (/cross[-\s]?sectional|survey|observational/.test(t)) return "observational";
  if (raw === "review" || /\bnarrative review\b|\bliterature review\b/.test(t)) return "review";
  if (raw === "preprint" || /preprint|arxiv|biorxiv|medrxiv/.test(t)) return "preprint";
  return "other";
}

// Bobot dasar berdasarkan hierarki bukti ilmiah.
const TYPE_WEIGHT: Record<StudyType, number> = {
  "meta-analysis": 40,
  "systematic-review": 36,
  rct: 32,
  cohort: 24,
  "case-control": 20,
  observational: 16,
  review: 14,
  preprint: 8,
  other: 12,
};

const PEER_REVIEWED: StudyType[] = [
  "meta-analysis",
  "systematic-review",
  "rct",
  "cohort",
  "case-control",
  "observational",
  "review",
];

export function scoreQuality(p: Paper): QualityScore {
  const studyType = classifyStudyType(p);
  const signals: string[] = [];
  const warnings: string[] = [];

  let score = TYPE_WEIGHT[studyType];
  signals.push(`Jenis: ${studyType}`);

  // Sitasi (maks +25): log-scaled supaya tidak didominasi paper viral.
  const citeBonus = Math.min(25, Math.round(Math.log10(p.citationCount + 1) * 9));
  score += citeBonus;
  if (p.citationCount >= 100) signals.push(`Banyak disitasi (${p.citationCount})`);
  else if (p.citationCount < 5) warnings.push("Sitasi sangat sedikit");

  // Recency (maks +15)
  if (p.year) {
    const age = new Date().getFullYear() - p.year;
    score += Math.max(0, 15 - age);
    if (age > 15) warnings.push("Publikasi cukup lama (>15 thn)");
  } else {
    warnings.push("Tahun publikasi tidak diketahui");
  }

  // Open access (+5) — transparansi
  if (p.isOpenAccess) {
    score += 5;
    signals.push("Open access");
  }

  // Abstrak tersedia (+5) — bisa diverifikasi
  if (p.abstract) score += 5;
  else warnings.push("Abstrak tidak tersedia");

  const peerReviewed = PEER_REVIEWED.includes(studyType);
  if (!peerReviewed) warnings.push("Belum tentu peer-reviewed");

  // Ukuran sampel — heuristik dari abstrak
  const sample = (p.abstract ?? "").match(/\bn\s*=\s*([\d,]{2,})/i);
  if (sample) {
    const n = parseInt(sample[1].replace(/,/g, ""), 10);
    if (n >= 1000) { score += 5; signals.push(`Sampel besar (n≈${n})`); }
    else if (n < 50) warnings.push(`Sampel kecil (n≈${n})`);
  }

  score = Math.max(0, Math.min(100, score));
  const level: QualityScore["level"] = score >= 70 ? "high" : score >= 45 ? "medium" : "low";

  return { paperId: p.id, studyType, score, level, peerReviewed, signals, warnings };
}

export function scoreAll(papers: Paper[]): QualityScore[] {
  return papers.map(scoreQuality);
}
