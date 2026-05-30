import { searchPapers } from "@/lib/academic/openalex";
import { scoreAll } from "@/lib/academic/quality";
import { chat } from "@/lib/ai/provider";
import {
  KEYWORD_SYSTEM,
  keywordPrompt,
  ANALYSIS_SYSTEM,
  analysisPrompt,
} from "@/lib/ai/prompts";
import type { AnalysisResult, EvidenceItem, Paper } from "@/lib/types";

// Parser JSON toleran — model open-source (mis. Llama Scout) kadang
// membungkus dengan teks/markdown atau menambah trailing comma.
function extractJson<T>(raw: string): T {
  let s = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Respons AI bukan JSON valid");
  s = s.slice(start, end + 1);
  try {
    return JSON.parse(s) as T;
  } catch {
    // Coba bersihkan trailing comma sebelum } atau ]
    const cleaned = s.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(cleaned) as T;
  }
}

async function extractKeywords(question: string) {
  const raw = await chat({
    system: KEYWORD_SYSTEM,
    user: keywordPrompt(question),
    maxTokens: 300,
    json: true,
  });
  const parsed = extractJson<{ keywords: string; claim: string }>(raw);
  // Fallback bila model mengabaikan format
  if (!parsed.keywords) parsed.keywords = question;
  if (!parsed.claim) parsed.claim = question;
  return parsed;
}

interface RawAnalysis {
  consensus: AnalysisResult["consensus"];
  confidence: number;
  summary: string;
  eli: string;
  supporting: { claim: string; paperRefs: number[]; strength: EvidenceItem["strength"] }[];
  opposing: { claim: string; paperRefs: number[]; strength: EvidenceItem["strength"] }[];
  debate: AnalysisResult["debate"];
  fallacies: AnalysisResult["fallacies"];
  caveats: string[];
}

async function runAnalysis(question: string, claim: string, papers: Paper[]) {
  const raw = await chat({
    system: ANALYSIS_SYSTEM,
    user: analysisPrompt(question, claim, papers),
    maxTokens: 4000,
    json: true,
  });
  return extractJson<RawAnalysis>(raw);
}

function refsToIds(refs: number[] | undefined, papers: Paper[]): string[] {
  return (refs ?? [])
    .map((n) => papers[n - 1]?.id)
    .filter((id): id is string => !!id);
}

// Default aman bila bagian opsional tidak diisi model.
const EMPTY_DEBATE: AnalysisResult["debate"] = {
  pro: { stance: "Tidak tersedia", arguments: [], weaknesses: [] },
  con: { stance: "Tidak tersedia", arguments: [], weaknesses: [] },
};

export async function analyze(question: string): Promise<AnalysisResult> {
  const { keywords, claim } = await extractKeywords(question);

  const papers = await searchPapers(keywords, 18);
  if (papers.length === 0) {
    throw new Error("Tidak ada paper relevan ditemukan. Coba pertanyaan yang lebih spesifik.");
  }

  const quality = scoreAll(papers);
  const raw = await runAnalysis(question, claim, papers);

  return {
    question,
    keywords: keywords.split(/\s+/).filter(Boolean),
    papersAnalyzed: papers.length,
    lowEvidence: papers.length < 5,
    consensus: raw.consensus ?? "insufficient",
    confidence: Math.max(0, Math.min(100, raw.confidence ?? 0)),
    summary: raw.summary ?? "",
    eli: raw.eli ?? "",
    supporting: (raw.supporting ?? []).map((e) => ({
      claim: e.claim,
      strength: e.strength,
      paperIds: refsToIds(e.paperRefs, papers),
    })),
    opposing: (raw.opposing ?? []).map((e) => ({
      claim: e.claim,
      strength: e.strength,
      paperIds: refsToIds(e.paperRefs, papers),
    })),
    debate: raw.debate ?? EMPTY_DEBATE,
    fallacies: raw.fallacies ?? [],
    caveats: raw.caveats ?? [],
    papers,
    quality,
  };
}
