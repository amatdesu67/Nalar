// Format hasil AnalysisResult dari API Nalar menjadi teks WhatsApp.
// Mirror dari src/lib/whatsapp/format.ts, ditulis ulang dalam JS biasa
// agar bot ini berdiri sendiri (tanpa build TypeScript).

const CONSENSUS_LABEL = {
  strong_support: "Bukti kuat mendukung",
  moderate_support: "Bukti cenderung mendukung",
  mixed: "Bukti terbelah",
  moderate_against: "Bukti cenderung menentang",
  strong_against: "Bukti kuat menentang",
  insufficient: "Bukti belum cukup",
};

const CONSENSUS_EMOJI = {
  strong_support: "✅",
  moderate_support: "✅",
  mixed: "⚖️",
  moderate_against: "❌",
  strong_against: "❌",
  insufficient: "❓",
};

const WA_MAX = 4000; // batas aman (limit teknis 4096)

function uniqueCount(items) {
  const set = new Set();
  for (const e of items || []) for (const id of e.paperIds || []) set.add(id);
  return set.size;
}

function formatReply(result) {
  const emoji = CONSENSUS_EMOJI[result.consensus] || "❓";
  const label = CONSENSUS_LABEL[result.consensus] || "Tidak diketahui";
  const proCount = uniqueCount(result.supporting);
  const conCount = uniqueCount(result.opposing);

  const summary =
    (result.summary || "").length > 600
      ? result.summary.slice(0, 597) + "…"
      : result.summary || "";

  // Paper teratas: urut skor kualitas, kecualikan retracted.
  const byScore = [...(result.quality || [])].sort((a, b) => b.score - a.score);
  const topLines = [];
  for (const q of byScore) {
    const p = (result.papers || []).find((x) => x.id === q.paperId);
    if (!p || p.isRetracted) continue;
    topLines.push(`${topLines.length + 1}. ${p.title} (${p.year ?? "n.d."})\n${p.url}`);
    if (topLines.length >= 3) break;
  }

  const parts = [
    "🔬 *Nalar — Bukti Ilmiah*",
    "",
    `Klaim: _${result.question}_`,
    "",
    `${emoji} *${label}* (keyakinan ${result.confidence ?? 0}%)`,
    `📚 ${result.papersAnalyzed ?? 0} paper · ✅ ${proCount} mendukung · ❌ ${conCount} menentang`,
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

const HELP_TEXT = [
  "👋 *Halo! Ini Nalar* — mesin pencari bukti ilmiah.",
  "",
  "Kirim sebuah *klaim, opini, atau topik debat*, nanti aku carikan paper akademik lalu kasih analisa netral (pro vs kontra) + tingkat konsensusnya.",
  "",
  "Contoh:",
  "• _Apakah kopi menyebabkan kanker?_",
  "• _Vaksin MMR menyebabkan autisme_",
  "• _Apakah puasa intermiten efektif menurunkan berat badan?_",
].join("\n");

module.exports = { formatReply, HELP_TEXT };
