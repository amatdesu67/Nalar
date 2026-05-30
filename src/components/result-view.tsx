"use client";
import { useState } from "react";
import { GraduationCap, Sparkles, AlertCircle, AlertTriangle, RotateCcw } from "lucide-react";
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
    <div className="animate-fade-up space-y-6">
      {onReset && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw size={14} />
            Cari lagi
          </Button>
        </div>
      )}

      {result.lowEvidence && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Bukti terbatas</p>
            <p className="text-amber-200/80">
              Hanya {result.papersAnalyzed} paper relevan yang ditemukan. Kesimpulan di bawah berisiko menyesatkan —
              perlakukan sebagai indikasi awal, bukan jawaban final, dan verifikasi ke sumber asli.
            </p>
          </div>
        </div>
      )}

      <ConsensusMeter consensus={result.consensus} confidence={result.confidence} papers={result.papersAnalyzed} />

      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
          <TabsTrigger value="evidence">Bukti</TabsTrigger>
          <TabsTrigger value="debate">Debate Mode</TabsTrigger>
          <TabsTrigger value="papers">Paper ({result.papers.length})</TabsTrigger>
        </TabsList>

        {/* Ringkasan */}
        <TabsContent value="summary" className="mt-5 space-y-4">
          <div className="rounded-xl border border-border bg-surface/40 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-serif text-base text-fg">
                <Sparkles size={15} className="text-accent" />
                {eli ? "Penjelasan sederhana" : "Ringkasan bukti"}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setEli((v) => !v)}>
                <GraduationCap size={14} />
                {eli ? "Mode akademik" : "Jelaskan untuk anak SMA"}
              </Button>
            </div>
            <p className="text-[15px] leading-relaxed text-fg/90">{eli ? result.eli : result.summary}</p>
          </div>

          {result.caveats.length > 0 && (
            <div className="rounded-xl border border-border bg-surface/30 p-4">
              <p className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                <AlertCircle size={12} /> Batasan analisis
              </p>
              <ul className="space-y-1.5 text-sm text-muted">
                {result.caveats.map((c, i) => (
                  <li key={i} className="flex gap-2">
                    <span>·</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        {/* Bukti dua sisi */}
        <TabsContent value="evidence" className="mt-5 grid gap-4 md:grid-cols-2">
          <EvidenceColumn title="Mendukung klaim" side="pro" items={result.supporting} papers={result.papers} />
          <EvidenceColumn title="Menentang klaim" side="con" items={result.opposing} papers={result.papers} />
        </TabsContent>

        {/* Debate */}
        <TabsContent value="debate" className="mt-5">
          <DebateMode result={result} />
        </TabsContent>

        {/* Paper */}
        <TabsContent value="papers" className="mt-5 grid gap-3 sm:grid-cols-2">
          {result.papers.map((p, i) => (
            <PaperCard key={p.id} paper={p} quality={qualityOf(p.id)} index={i} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
