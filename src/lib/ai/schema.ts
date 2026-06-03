// Skema validasi respons AI dengan Zod.
// Model open-source (mis. Llama Scout) sering mengembalikan JSON yang tidak
// lengkap atau field yang salah tipe. Skema ini bersifat TOLERAN: setiap
// field punya nilai default via `.catch()`, sehingga respons parsial tetap
// menghasilkan struktur valid alih-alih melempar error. Ini melindungi UI
// dari "model drift" tanpa menggagalkan seluruh analisis.

import { z } from "zod";
import type { AnalysisResult } from "@/lib/types";

const StrengthSchema = z
  .enum(["strong", "moderate", "weak"])
  .catch("moderate");

const ConsensusSchema = z
  .enum([
    "strong_support",
    "moderate_support",
    "mixed",
    "moderate_against",
    "strong_against",
    "insufficient",
  ])
  .catch("insufficient");

// Confidence: terima angka apa pun (atau string angka), lalu clamp ke 0-100.
const ConfidenceSchema = z.coerce
  .number()
  .catch(0)
  .transform((n) => Math.max(0, Math.min(100, Math.round(n))));

const EvidenceRawSchema = z
  .object({
    claim: z.string().catch(""),
    paperRefs: z.array(z.coerce.number()).catch([]),
    strength: StrengthSchema,
  })
  .catch({ claim: "", paperRefs: [], strength: "moderate" });

const DebatePositionSchema = z
  .object({
    stance: z.string().catch(""),
    arguments: z.array(z.string()).catch([]),
    weaknesses: z.array(z.string()).catch([]),
  })
  .catch({ stance: "", arguments: [], weaknesses: [] });

const FallacySchema = z
  .object({
    name: z.string().catch(""),
    explanation: z.string().catch(""),
  })
  .catch({ name: "", explanation: "" });

// Respons mentah dari prompt analisis (sebelum paperRefs dipetakan ke id).
export const RawAnalysisSchema = z.object({
  consensus: ConsensusSchema,
  confidence: ConfidenceSchema,
  summary: z.string().catch(""),
  eli: z.string().catch(""),
  supporting: z.array(EvidenceRawSchema).catch([]),
  opposing: z.array(EvidenceRawSchema).catch([]),
  debate: z
    .object({ pro: DebatePositionSchema, con: DebatePositionSchema })
    .catch({
      pro: { stance: "", arguments: [], weaknesses: [] },
      con: { stance: "", arguments: [], weaknesses: [] },
    }),
  fallacies: z.array(FallacySchema).catch([]),
  caveats: z.array(z.string()).catch([]),
});

export type RawAnalysis = z.infer<typeof RawAnalysisSchema>;

// Respons prompt ekstraksi kata kunci.
export const KeywordSchema = z.object({
  keywords: z.string().catch(""),
  claim: z.string().catch(""),
});

export type KeywordResult = z.infer<typeof KeywordSchema>;

// Pembuktian tipe: struktur skema selaras dengan kontrak AnalysisResult.
type _ConsensusMatches = z.infer<typeof ConsensusSchema> extends
  AnalysisResult["consensus"]
  ? true
  : never;
const _check: _ConsensusMatches = true;
void _check;
