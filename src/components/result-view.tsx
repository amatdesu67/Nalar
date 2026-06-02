"use client";
import { useState } from "react";
import { GraduationCap, Sparkles, AlertCircle, AlertTriangle, RotateCcw, MessageSquareQuote } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ConsensusMeter } from "@/components/confidence-meter";
import { EvidenceColumn } from "@/components/evidence-column";
import { DebateMode } from "@/components/debate-mode";
import { PaperCard } from "@/components/paper-card";

export function ResultView({ result, onReset }: { result: AnalysisResult; onReset?: () => void }) {
  const [eli, setEli] = useState(false);
  const qualityOf = (id: string) => result.quality.find((q) => q.paperId === id);

  return (
    <div className="animate-fade-up space-y-7">
      {/* Top bar: Question echo + Reset */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <MessageSquareQuote size={16} className="text-accent shrink-0" />
          <p className="text-sm font-serif italic text-muted truncate">
            &ldquo;{result.question}&rdquo;
          </p>
        </div>
        {onReset && (
          <Button variant="outline" size="sm" onClick={onReset} className="shrink-0 border-border/60 hover:border-accent/40 hover:text-accent transition-all duration-300">
            <RotateCcw size={13} />
            Cari lagi
          </Button>
        )}
      </div>

      {/* Low Evidence Warning */}
      {result.lowEvidence && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-amber-300 backdrop-blur">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold text-amber-300">Bukti terbatas</p>
            <p className="mt-1 text-amber-200/75 text-[13px] leading-relaxed">
              Hanya {result.papersAnalyzed} paper relevan yang ditemukan. Kesimpulan di bawah berisiko menyesatkan —
              perlakukan sebagai indikasi awal, bukan jawaban final, dan verifikasi ke sumber asli.
            </p>
          </div>
        </div>
      )}

      {/* Retraction notice */}
      {result.retractedCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-con/30 bg-con/[0.06] p-4 text-sm">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-con" />
          <p className="text-con/90 text-[13px] leading-relaxed">
            <span className="font-semibold text-con">
              {result.retractedCount} paper ditarik (retracted)
            </span>{" "}
            ditemukan dan <strong>dikecualikan</strong> dari konsensus. Lihat tab Paper untuk detailnya.
          </p>
        </div>
      )}

      {/* Consensus Dashboard */}
      <ConsensusMeter consensus={result.consensus} confidence={result.confidence} papers={result.papersAnalyzed} />

      {/* Tabbed Results */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
          <TabsTrigger value="evidence">Bukti</TabsTrigger>
          <TabsTrigger value="debate">Debate Mode</TabsTrigger>
          <TabsTrigger value="papers">Paper ({result.papers.length})</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="mt-6 space-y-5">
          <div className="glass-panel glow-card rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute bottom-0 right-0 w-40 h-32 bg-accent/4 rounded-full filter blur-3xl pointer-events-none" />

            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2.5 font-serif text-lg font-bold text-fg">
                <Sparkles size={16} className="text-accent" />
                {eli ? "Penjelasan Sederhana" : "Ringkasan Bukti Ilmiah"}
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEli((v) => !v)}
                className="border-border/60 hover:border-accent/40 hover:text-accent transition-all duration-300"
              >
                <GraduationCap size={14} />
                {eli ? "Mode akademik" : "Mode SMA"}
              </Button>
            </div>
            <p className="text-[15px] leading-[1.8] text-fg/90 relative">{eli ? result.eli : result.summary}</p>
          </div>

          {/* Caveats */}
          {result.caveats.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-surface/20 p-5">
              <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
                <AlertCircle size={13} className="text-amber-500/70" /> Batasan Analisis
              </p>
              <ul className="space-y-2 text-[13px] text-muted/90 leading-relaxed">
                {result.caveats.map((c, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="text-amber-500/60 font-bold shrink-0 select-none">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="mt-6 grid gap-5 md:grid-cols-2">
          <EvidenceColumn title="Mendukung klaim" side="pro" items={result.supporting} papers={result.papers} />
          <EvidenceColumn title="Menentang klaim" side="con" items={result.opposing} papers={result.papers} />
        </TabsContent>

        {/* Debate Tab */}
        <TabsContent value="debate" className="mt-6">
          <DebateMode result={result} />
        </TabsContent>

        {/* Papers Tab */}
        <TabsContent value="papers" className="mt-6 grid gap-4 sm:grid-cols-2">
          {result.papers.map((p, i) => (
            <PaperCard key={p.id} paper={p} quality={qualityOf(p.id)} index={i} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
