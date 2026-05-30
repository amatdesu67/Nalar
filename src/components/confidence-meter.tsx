import type { ConsensusLevel } from "@/lib/types";
import { CONSENSUS_LABEL, CONSENSUS_POS } from "@/lib/labels";

export function ConsensusMeter({
  consensus,
  confidence,
  papers,
}: {
  consensus: ConsensusLevel;
  confidence: number;
  papers: number;
}) {
  const pos = CONSENSUS_POS[consensus];
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-serif text-lg text-fg">{CONSENSUS_LABEL[consensus]}</p>
        <span className="font-mono text-xs text-muted">{papers} paper dianalisis</span>
      </div>

      {/* Spektrum konsensus */}
      <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-con via-muted/40 to-pro">
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-fg shadow-lg transition-all"
          style={{ left: `${pos}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted">
        <span>Menentang</span>
        <span>Netral</span>
        <span>Mendukung</span>
      </div>

      {/* Confidence */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted">Tingkat keyakinan kesimpulan</span>
          <span className="font-mono text-accent">{confidence}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700"
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
}
