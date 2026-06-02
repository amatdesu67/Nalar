import type { AnalysisResult, ConsensusLevel } from "@/lib/types";
import { CONSENSUS_LABEL } from "@/lib/labels";

const CONSENSUS_EMOJI: Record<ConsensusLevel, string> = {
  strong_support: "✅",
  moderate_support: "✅",
  mixed: "⚖️",
  moderate_against: "❌",
  strong_against: "❌",
  insufficient: "❓",
};

const WA_MAX = 4000; // batas aman pesan WhatsApp (limit teknis 4096)

/**
 * Format AnalysisResult menjadi pesan teks WhatsApp.
 * Pakai *tebal* dan _miring_ sesuai markup WA, emoji secukupnya.
 * Fungsi murni agar mudah diuji.
 */
export function formatAnalysis(result: AnalysisResult): string {
  const emoji = CONSENSUS_EMOJI[result.consensus];
  const proCount = new Set(result.supporting.flatMap((e) => e.paperIds)).size;
  const conCount = new Set(result.opposing.flatMap((e) => e.paperIds)).size;

  // Ringkasan dipangkas agar pesan tidak kepanjangan.
  const summary = result.summary.length > 600 ? result.summary.slice(0, 597) + "…" : result.summary;

  // Paper teratas: urutkan berdasar skor kualitas, kecualikan retracted.
  const byScore = [...result.quality].sort((a, b) => b.score - a.score);
  const topLines: string[] = [];
  for (const q of byScore) {
    const p = result.papers.find((x) => x.id === q.paperId);
    if (!p || p.isRetracted) continue;
    topLines.push(`${topLines.length + 1}. ${p.title} (${p.year ?? "n.d."})\n${p.url}`);
    if (topLines.length >= 3) break;
  }

  const parts = [
    "🔬 *Nalar — Bukti Ilmiah*",
    "",
    `Klaim: _${result.question}_`,
    "",
    `${emoji} *${CONSENSUS_LABEL[result.consensus]}* (keyakinan ${result.confidence}%)`,
    `📚 ${result.papersAnalyzed} paper · ✅ ${proCount} mendukung · ❌ ${conCount} menentang`,
  ];

  if (result.retractedCount > 0) {
    parts.push(`⚠️ ${result.retractedCount} paper ditarik (retracted) dikecualikan.`);
  }

  parts.push("", summary);

  if (result.lowEvidence) {
    parts.push("", "⚠️ _Bukti terbatas — perlakukan sebagai indikasi awal, bukan jawaban final._");
  }

  if (topLines.length > 0) {
    parts.push("", "*Paper teratas:*", ...topLines);
  }

  parts.push("", "_Selalu verifikasi ke sumber asli. Dibuat oleh Nalar._");

  const msg = parts.join("\n");
  return msg.length > WA_MAX ? msg.slice(0, WA_MAX - 1) + "…" : msg;
}
