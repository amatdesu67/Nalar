// Kontrak data tunggal untuk seluruh aplikasi.

export type StudyType =
  | "meta-analysis"
  | "systematic-review"
  | "rct"
  | "cohort"
  | "case-control"
  | "observational"
  | "review"
  | "preprint"
  | "other";

export type ConsensusLevel =
  | "strong_support"
  | "moderate_support"
  | "mixed"
  | "moderate_against"
  | "strong_against"
  | "insufficient";

export interface Paper {
  id: string;
  title: string;
  abstract: string | null;
  authors: string[];
  year: number | null;
  venue: string | null;
  citationCount: number;
  doi: string | null;
  url: string;
  isOpenAccess: boolean;
  type: string | null; // tipe mentah dari sumber
}

// Hasil penilaian kualitas sumber (deterministik, tanpa AI).
export interface QualityScore {
  paperId: string;
  studyType: StudyType;
  score: number; // 0-100
  level: "high" | "medium" | "low";
  peerReviewed: boolean;
  signals: string[]; // alasan singkat penilaian
  warnings: string[]; // potensi bias / keterbatasan
}

export interface EvidenceItem {
  claim: string;          // poin argumen, bahasa netral
  paperIds: string[];     // paper pendukung poin ini
  strength: "strong" | "moderate" | "weak";
}

export interface DebatePosition {
  stance: string;         // posisi (pro / kontra)
  arguments: string[];
  weaknesses: string[];   // kelemahan posisi ini
}

export interface Fallacy {
  name: string;
  explanation: string;
}

export interface AnalysisResult {
  question: string;
  keywords: string[];
  papersAnalyzed: number;
  consensus: ConsensusLevel;
  confidence: number;     // 0-100
  summary: string;        // ringkasan netral
  eli: string;            // mode "Jelaskan untuk Anak SMA"
  supporting: EvidenceItem[];
  opposing: EvidenceItem[];
  debate: { pro: DebatePosition; con: DebatePosition };
  fallacies: Fallacy[];
  caveats: string[];      // batasan analisis
  papers: Paper[];
  quality: QualityScore[];
}

export interface ApiError {
  error: string;
}
