import { Check, X, Bookmark } from "lucide-react";
import type { EvidenceItem, Paper } from "@/lib/types";

const STRENGTH_LABEL = { strong: "bukti kuat", moderate: "bukti sedang", weak: "bukti lemah" } as const;

const STYLES = {
  pro: { 
    wrap: "bg-pro/10 border border-pro/20 text-pro shadow-[0_0_15px_rgba(16,185,129,0.1)]", 
    chip: "text-pro bg-pro/5 border border-pro/20 font-bold", 
    card: "border-pro/10 hover:border-pro/30 hover:shadow-[0_4px_20px_rgba(16,185,129,0.06)] bg-pro/[0.01]",
    icon: Check 
  },
  con: { 
    wrap: "bg-con/10 border border-con/20 text-con shadow-[0_0_15px_rgba(239,68,68,0.1)]", 
    chip: "text-con bg-con/5 border border-con/20 font-bold", 
    card: "border-con/10 hover:border-con/30 hover:shadow-[0_4px_20px_rgba(239,68,68,0.06)] bg-con/[0.01]",
    icon: X 
  },
} as const;

export function EvidenceColumn({
  title,
  side,
  items,
  papers,
}: {
  title: string;
  side: "pro" | "con";
  items: EvidenceItem[];
  papers: Paper[];
}) {
  const s = STYLES[side];
  const Icon = s.icon;
  const refIndex = (id: string) => papers.findIndex((p) => p.id === id) + 1;

  return (
    <div className="glass-panel glow-card rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
      
      {/* Column Title Header */}
      <div className="flex items-center gap-3 border-b border-border/40 pb-4">
        <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${s.wrap} shrink-0`}>
          <Icon size={15} />
        </span>
        <h3 className="font-serif text-lg font-bold text-fg">{title}</h3>
        <span className="ml-auto font-mono text-xs text-muted/70 bg-surface/60 px-2 py-0.5 rounded border border-border/30">
          {items.length} klaim
        </span>
      </div>

      {/* Evidence Items List */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
          <Bookmark size={20} className="text-muted/30" />
          <p className="text-xs text-muted/65 leading-relaxed max-w-[200px]">
            Tidak ada temuan klaim signifikan yang mendukung sisi ini dari paper yang dianalisis.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((e, i) => (
            <li 
              key={i} 
              className={`rounded-xl border p-4 transition-all duration-300 ${s.card}`}
            >
              <p className="text-[14px] leading-relaxed text-fg/90 font-medium">{e.claim}</p>
              
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* Scientific Strength Badge */}
                <span className={`rounded-md px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${s.chip}`}>
                  {STRENGTH_LABEL[e.strength]}
                </span>
                
                {/* Connected Paper Source Indices */}
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[9px] uppercase text-muted/50 mr-0.5">Sumber:</span>
                  {e.paperIds.map((id) => {
                    const n = refIndex(id);
                    return n > 0 ? (
                      <span 
                        key={id} 
                        className="font-mono text-[10px] bg-surface/80 border border-border/40 hover:border-accent/40 hover:text-accent cursor-help px-1.5 py-0.5 rounded text-muted transition-colors"
                        title={papers[n-1]?.title}
                      >
                        [{n}]
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
