import { searchPapers } from "@/lib/academic/openalex";
import { scoreAll } from "@/lib/academic/quality";
import { chat } from "@/lib/ai/provider";
import {
  KEYWORD_SYSTEM,
  keywordPrompt,
  ANALYSIS_SYSTEM,
  analysisPrompt,
} from "@/lib/ai/prompts";
import { KeywordSchema, RawAnalysisSchema } from "@/lib/ai/schema";
import type { AnalysisResult, Paper } from "@/lib/types";
import type { ChatOptions } from "@/lib/ai/provider";
import type { z } from "zod";

// Ambil objek JSON dari respons mentah — model open-source (mis. Llama Scout)
// kadang membungkus dengan teks/markdown atau menambah trailing comma.
export function extractJsonObject(raw: string): unknown {
  let s = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Respons AI bukan JSON valid");
  s = s.slice(start, end + 1);
  try {
    return JSON.parse(s);
  } catch {
    // Coba bersihkan trailing comma sebelum } atau ]
    const cleaned = s.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(cleaned);
  }
}

// Panggil model lalu validasi dengan skema Zod. Bila JSON gagal di-ekstrak,
// coba sekali lagi (model sering benar pada percobaan kedua) sebelum menyerah.
// Catatan: skema bersifat toleran (default via .catch), jadi `parse` di sini
// hanya melempar bila objek JSON tak ditemukan sama sekali.
async function chatJson<S extends z.ZodTypeAny>(
  opts: ChatOptions,
  schema: S
): Promise<z.infer<S>> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await chat(opts);
    try {
      return schema.parse(extractJsonObject(raw));
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(
    `Respons AI bukan JSON valid: ${
      lastErr instanceof Error ? lastErr.message : "format tidak dikenali"
    }`
  );
}

async function extractKeywords(question: string) {
  const parsed = await chatJson(
    { system: KEYWORD_SYSTEM, user: keywordPrompt(question), maxTokens: 300, json: true },
    KeywordSchema
  );
  // Fallback bila model mengabaikan format
  return {
    keywords: parsed.keywords || question,
    claim: parsed.claim || question,
  };
}

async function runAnalysis(question: string, claim: string, papers: Paper[]) {
  return chatJson(
    {
      system: ANALYSIS_SYSTEM,
      user: analysisPrompt(question, claim, papers),
      maxTokens: 4000,
      json: true,
    },
    RawAnalysisSchema
  );
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

  // Kecualikan paper yang sudah ditarik (retracted) dari analisis — konsensus &
  // bukti tidak boleh bersandar pada paper cacat. Tetap ditampilkan ke pengguna
  // dengan banner peringatan. Indeks [n] pada prompt & refsToIds harus memakai
  // array yang SAMA (analyzed), agar sitasi tidak tertuju ke paper yang salah.
  const analyzed = papers.filter((p) => !p.isRetracted);
  const retractedCount = papers.length - analyzed.length;
  if (analyzed.length === 0) {
    throw new Error("Semua paper yang ditemukan telah ditarik (retracted). Coba pertanyaan lain.");
  }

  const quality = scoreAll(papers);
  const raw = await runAnalysis(question, claim, analyzed);

  return {
    question,
    keywords: keywords.split(/\s+/).filter(Boolean),
    papersAnalyzed: analyzed.length,
    retractedCount,
    lowEvidence: analyzed.length < 5,
    consensus: raw.consensus ?? "insufficient",
    confidence: Math.max(0, Math.min(100, raw.confidence ?? 0)),
    summary: raw.summary ?? "",
    eli: raw.eli ?? "",
    supporting: (raw.supporting ?? []).map((e) => ({
      claim: e.claim,
      strength: e.strength,
      paperIds: refsToIds(e.paperRefs, analyzed),
    })),
    opposing: (raw.opposing ?? []).map((e) => ({
      claim: e.claim,
      strength: e.strength,
      paperIds: refsToIds(e.paperRefs, analyzed),
    })),
    debate: raw.debate ?? EMPTY_DEBATE,
    fallacies: raw.fallacies ?? [],
    caveats: raw.caveats ?? [],
    papers,
    quality,
  };
}
