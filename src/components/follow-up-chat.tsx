"use client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Loader2, Sparkles } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import type { ChatMessage } from "@/lib/ai/chat-prompt";

const SUGGESTIONS = [
  "Jelaskan lebih dalam soal poin kontra",
  "Apa keterbatasan terbesar bukti ini?",
  "Paper mana yang paling kuat?",
];

// Riwayat chat disimpan per pencarian (kunci dari pertanyaan).
function storageKey(question: string) {
  let h = 0;
  for (let i = 0; i < question.length; i++) h = (Math.imul(31, h) + question.charCodeAt(i)) | 0;
  return `nalar:chat:${h >>> 0}`;
}

export function FollowUpChat({ result }: { result: AnalysisResult }) {
  const key = storageKey(result.question);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Muat riwayat saat pencarian berganti.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setMessages(raw ? (JSON.parse(raw) as ChatMessage[]) : []);
    } catch {
      setMessages([]);
    }
    setError(null);
  }, [key]);

  // Simpan & auto-scroll tiap pesan berubah.
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      localStorage.setItem(key, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, key]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: result.question,
          summary: result.summary,
          papers: result.papers
            .filter((p) => !p.isRetracted)
            .map((p) => ({ title: p.title, year: p.year, authors: p.authors, abstract: p.abstract })),
          messages: next,
        }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok || !data.answer) throw new Error(data.error || "Gagal menjawab.");
      setMessages((m) => [...m, { role: "assistant", content: data.answer as string }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menjawab. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/20 p-5">
      <p className="mb-1 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
        <MessageCircle size={13} className="text-accent" /> Tanya Lanjutan
      </p>
      <p className="mb-4 text-[12px] leading-relaxed text-muted/80">
        Tanya apa pun soal hasil ini — dijawab berdasarkan abstrak paper yang ditemukan.
      </p>

      {messages.length > 0 && (
        <div ref={scrollRef} className="mb-3 max-h-80 space-y-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-accent/15 border border-accent/20 px-3.5 py-2 text-[13px] text-fg/90"
                    : "max-w-[90%] rounded-2xl rounded-bl-sm border border-border/50 bg-surface/40 px-3.5 py-2 text-[13px] leading-relaxed text-fg/85"
                }
              >
                {m.role === "assistant" && (
                  <span className="mb-1 flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-accent/70">
                    <Sparkles size={10} /> Nalar
                  </span>
                )}
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border/50 bg-surface/40 px-3.5 py-2 text-[13px] text-muted">
                <Loader2 size={13} className="animate-spin" /> Menyusun jawaban…
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saran pertanyaan saat masih kosong */}
      {messages.length === 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={loading}
              className="rounded-full border border-border/60 bg-surface/30 px-3 py-1.5 text-[11px] text-muted transition-all hover:border-accent/40 hover:text-accent disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mb-2 text-[12px] text-con/80">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tulis pertanyaan lanjutan…"
          maxLength={500}
          className="flex-1 rounded-xl border border-border/60 bg-surface/30 px-3.5 py-2.5 text-[13px] text-fg placeholder:text-muted/50 outline-none transition-colors focus:border-accent/40"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 text-accent transition-all hover:bg-accent/25 disabled:opacity-40"
          aria-label="Kirim"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </form>
    </div>
  );
}
