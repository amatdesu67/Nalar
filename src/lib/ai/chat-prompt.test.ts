import { describe, it, expect } from "vitest";
import { buildChatUserPrompt, type ChatContext, type ChatMessage } from "@/lib/ai/chat-prompt";

const ctx: ChatContext = {
  question: "Apakah kopi menyebabkan kanker?",
  summary: "Mayoritas bukti tidak menemukan kaitan.",
  papers: [
    { title: "Coffee and cancer risk", year: 2019, authors: ["A", "B", "C", "D"], abstract: "No association found." },
    { title: "Caffeine review", year: 2021, authors: ["E"], abstract: null },
  ],
};

describe("buildChatUserPrompt", () => {
  it("menyertakan klaim, ringkasan, dan daftar paper berindeks", () => {
    const out = buildChatUserPrompt(ctx, [{ role: "user", content: "Jelaskan lebih dalam" }]);
    expect(out).toContain("Apakah kopi menyebabkan kanker?");
    expect(out).toContain("Mayoritas bukti tidak menemukan kaitan.");
    expect(out).toContain("[1] (2019) Coffee and cancer risk");
    expect(out).toContain("et al."); // 4 authors → dipangkas
    expect(out).toContain("[2] (2021) Caffeine review");
    expect(out).toContain("Abstrak tidak tersedia."); // abstract null
  });

  it("memasukkan transkrip percakapan", () => {
    const history: ChatMessage[] = [
      { role: "user", content: "P1" },
      { role: "assistant", content: "J1" },
      { role: "user", content: "P2" },
    ];
    const out = buildChatUserPrompt(ctx, history);
    expect(out).toContain("Pengguna: P1");
    expect(out).toContain("Asisten: J1");
    expect(out).toContain("Pengguna: P2");
  });

  it("memangkas riwayat sangat panjang ke 8 pesan terakhir", () => {
    const history: ChatMessage[] = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `M${i}`,
    }));
    const out = buildChatUserPrompt(ctx, history);
    expect(out).not.toContain("M0");
    expect(out).toContain("M19");
  });
});
