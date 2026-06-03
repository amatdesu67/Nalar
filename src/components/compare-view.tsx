"use client";
import { useState } from "react";
import { GitCompare, Loader2, AlertTriangle, BookOpen, Sparkles } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { CONSENSUS_LABEL } from "@/lib/labels";
import { ConsensusMeter } from "@/components/confidence-meter";
import { analyzeClaim } from "@/lib/analyze-client";

type Side = { result?: AnalysisResult; error?: string } | null;

function ResultCard({ claim, data }: { claim: string; data: AnalysisResult }) {
  const proCount = new Set(data.supporting.flatMap((e) => e.paperIds)).size;
  const conCount = new Set(data.opposing.flatMap((e) => e.paperIds)).size;
  const stats = [
    { v: data.papersAnalyzed, l: "Paper", c: "text-accent" },
    { v: proCount, l: "Mendukung", c: "text-pro" },
    { v: conCount, l: "Menentang", c: "text-con" },
  ];
  return (
    <div className="space-y-4">
      <p className="font-serif text-[15px] font-semibold italic leading-snug text-fg/90">&ldquo;{claim}&rdquo;</p>
      <ConsensusMeter consensus={data.consensus} confidence={data.confidence} papers={data.papersAnalyzed} />
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-surface/20 p-3 text-center">
            <p className={`font-serif text-2xl font-bold ${s.c}`}>{s.v}</p>
            <p className="mt-0.5 text-[11px] text-muted">{s.l}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border/60 bg-surface/20 p-4">
        <p className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
          <Sparkles size={12} className="text-accent" /> Ringkasan
        </p>
        <p className="text-[13px] leading-relaxed text-fg/85 line-clamp-[8]">{data.summary}</p>
      </div>
    </div>
  );
}

function ClaimInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent/80">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={2}
        placeholder="Tulis sebuah klaim untuk diuji…"
        className="w-full resize-none rounded-2xl border border-border/80 bg-surface/30 px-4 py-3 text-[15px] text-fg outline-none transition-all placeholder:text-muted/60 focus:border-accent/70 focus:shadow-[0_0_20px_hsl(var(--accent)/0.1)] disabled:opacity-60"
      />
    </div>
  );
}

export function CompareView() {
  const [qA, setQA] = useState("");
  const [qB, setQB] = useState("");
  const [busy, setBusy] = useState(false);
  const [a, setA] = useState<Side>(null);
  const [b, setB] = useState<Side>(null);

  const canRun = qA.trim().length >= 5 && qB.trim().length >= 5 && !busy;
  const hasResults = a || b;

  async function run() {
    if (!canRun) return;
    setBusy(true);
    setA(null);
    setB(null);
    const [ra, rb] = await Promise.allSettled([analyzeClaim(qA.trim()), analyzeClaim(qB.trim())]);
    setA(ra.status === "fulfilled" ? { result: ra.value } : { error: errMsg(ra.reason) });
    setB(rb.status === "fulfilled" ? { result: rb.value } : { error: errMsg(rb.reason) });
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      {/* Dua input klaim bersebelahan (menumpuk di mobile) */}
      <div className="grid gap-4 md:grid-cols-2">
        <ClaimInput label="Klaim A" value={qA} onChange={setQA} disabled={busy} />
        <ClaimInput label="Klaim B" value={qB} onChange={setQB} disabled={busy} />
      </div>

      <div className="flex justify-center">
        <button
          onClick={run}
          disabled={!canRun}
          className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent/90 px-6 text-xs font-semibold uppercase tracking-wider text-bg transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_4px_16px_hsl(var(--accent)/0.25)] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <GitCompare size={15} />}
          {busy ? "Menganalisis dua klaim…" : "Bandingkan"}
        </button>
      </div>

      {busy && (
        <p className="flex items-center justify-center gap-2 text-sm text-muted">
          <BookOpen size={14} className="text-accent" /> Menarik & menganalisis paper untuk kedua klaim…
        </p>
      )}

      {/* Hasil side-by-side (menumpuk di mobile = atas-bawah) */}
      {hasResults && !busy && (
        <div className="grid gap-6 md:grid-cols-2">
          {[a, b].map((side, i) => (
            <div key={i} className="animate-fade-up rounded-2xl border border-border/50 bg-surface/10 p-4 md:p-5">
              {side?.result ? (
                <ResultCard claim={i === 0 ? qA : qB} data={side.result} />
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-con/30 bg-con/5 p-4 text-sm text-con">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Gagal menganalisis {i === 0 ? "Klaim A" : "Klaim B"}</p>
                    <p className="mt-1 text-con/80 leading-relaxed">{side?.error}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "Terjadi kesalahan tak terduga.";
}
