import type { ConsensusLevel, StudyType } from "@/lib/types";

export const CONSENSUS_LABEL: Record<ConsensusLevel, string> = {
  strong_support: "Bukti kuat mendukung",
  moderate_support: "Bukti cenderung mendukung",
  mixed: "Bukti terbelah",
  moderate_against: "Bukti cenderung menentang",
  strong_against: "Bukti kuat menentang",
  insufficient: "Bukti belum cukup",
};

// posisi 0..100 pada spektrum menentang→mendukung
export const CONSENSUS_POS: Record<ConsensusLevel, number> = {
  strong_against: 8,
  moderate_against: 28,
  mixed: 50,
  insufficient: 50,
  moderate_support: 72,
  strong_support: 92,
};

export const STUDY_LABEL: Record<StudyType, string> = {
  "meta-analysis": "Meta-analysis",
  "systematic-review": "Systematic review",
  rct: "RCT",
  cohort: "Studi kohort",
  "case-control": "Case-control",
  observational: "Observasional",
  review: "Review",
  preprint: "Preprint",
  other: "Lainnya",
};

export const QUALITY_COLOR = {
  high: "hsl(var(--pro))",
  medium: "hsl(var(--accent))",
  low: "hsl(var(--con))",
} as const;
