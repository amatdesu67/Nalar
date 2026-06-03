"use client";
import { useState } from "react";
import { Link2, Loader2, Sparkles, ArrowRight } from "lucide-react";

export function LinkExtractor({ onPick }: { onPick: (claim: string) => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claims, setClaims] = useState<string[]>([]);
  const [title, setTitle] = useState<string | null>(null);

  async function extract(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    setClaims([]);
    setTitle(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as { claims?: string[]; title?: string | null; error?: string };
      if (!res.ok || !data.claims) throw new Error(data.error || "Gagal mengekstrak klaim.");
      setClaims(data.claims);
      setTitle(data.title ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengekstrak klaim.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-accent"
      >
        <Link2 size={13} /> Atau tempel link artikel/berita
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-surface/20 p-3.5">
      <form onSubmit={extract} className="flex items-center gap-2">
        <Link2 size={15} className="shrink-0 text-muted/60" />
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… tautan artikel"
          className="flex-1 bg-transparent text-[13px] text-fg placeholder:text-muted/50 outline-none"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="shrink-0 rounded-lg bg-accent/15 border border-accent/30 px-3 py-1.5 text-[12px] font-semibold text-accent transition-colors hover:bg-accent/25 disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Ekstrak"}
        </button>
      </form>

      {error && <p className="mt-2.5 text-[12px] text-con/80">{error}</p>}

      {claims.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
            <Sparkles size={11} className="text-accent" /> Klaim yang bisa dicek
            {title && <span className="font-sans font-normal normal-case tracking-normal text-muted/60">· {title}</span>}
          </p>
          {claims.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPick(c)}
              className="group flex w-full items-center gap-3 rounded-lg border border-border/50 bg-surface/30 p-2.5 text-left transition-all hover:border-accent/40 hover:bg-surface/50"
            >
              <span className="text-[13px] leading-snug text-fg/85 group-hover:text-accent">{c}</span>
              <ArrowRight size={14} className="ml-auto shrink-0 text-muted/40 transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
