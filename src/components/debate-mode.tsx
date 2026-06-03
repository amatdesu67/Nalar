import { Swords, ShieldAlert, Brain, Info, HelpCircle } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

function Position({ data, tone }: { data: AnalysisResult["debate"]["pro"]; tone: "pro" | "con" }) {
  const accent = tone === "pro" ? "border-pro/20 hover:border-pro/40 hover:shadow-[0_4px_25px_rgba(16,185,129,0.05)] bg-pro/[0.01]" : "border-con/20 hover:border-con/40 hover:shadow-[0_4px_25px_rgba(239,68,68,0.05)] bg-con/[0.01]";
  const dot = tone === "pro" ? "bg-pro shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-con shadow-[0_0_10px_rgba(239,68,68,0.5)]";
  const labelColor = tone === "pro" ? "text-gradient-pro font-serif" : "text-gradient-con font-serif";
  const numColor = tone === "pro" ? "text-pro bg-pro/10" : "text-con bg-con/10";
  
  return (
    <div className={`rounded-2xl border ${accent} p-5 md:p-6 transition-all duration-300`}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className={`h-2.5 w-2.5 rounded-full ${dot} shrink-0`} />
        <h3 className={`text-lg font-bold ${labelColor}`}>{tone === "pro" ? "Posisi Pro" : "Posisi Kontra"}</h3>
      </div>
      
      {/* Dynamic stance brief */}
      <p className="mb-5 text-[14px] italic text-muted/90 leading-relaxed border-l-2 border-border/60 pl-3">
        &ldquo;{data.stance}&rdquo;
      </p>

      {/* Main Arguments */}
      <div className="space-y-3 mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted/70">
          Argumen Utama
        </p>
        <ul className="space-y-3">
          {data.arguments.map((a, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] text-fg/90 leading-relaxed">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold ${numColor}`}>
                {i + 1}
              </span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Weaknesses section */}
      <div className="space-y-3 border-t border-border/40 pt-4">
        <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-amber-500/80">
          <ShieldAlert size={13} className="text-amber-500" /> Kelemahan Posisi Ini
        </p>
        <ul className="space-y-2">
          {data.weaknesses.map((w, i) => (
            <li key={i} className="flex gap-2 text-[13px] text-muted/80 leading-relaxed">
              <span className="text-amber-500/60 font-bold select-none shrink-0">•</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function DebateMode({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-6">
      {/* Stance Header Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface/30 px-4 py-3.5 text-xs text-muted/90 max-w-3xl">
        <Swords size={16} className="text-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          **Debate Mode** menyintesis sudut pandang PRO dan KONTRA secara seimbang dari kumpulan data paper yang sama. Gunakan ini untuk memahami argumen ilmiah terdalam beserta titik lemah masing-masing posisi.
        </p>
      </div>

      {/* Grid Comparison */}
      <div className="grid gap-5 md:grid-cols-2">
        <Position data={result.debate.pro} tone="pro" />
        <Position data={result.debate.con} tone="con" />
      </div>

      {/* Cognitive Fallacies */}
      {result.fallacies.length > 0 && (
        <div className="glass-panel glow-card rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
          {/* Subtle background warning gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full filter blur-xl pointer-events-none" />

          <h3 className="mb-4 flex items-center gap-2.5 font-serif text-lg font-bold text-fg">
            <Brain size={18} className="text-accent shrink-0" /> Waspadai Kesalahan Penalaran
          </h3>
          <p className="text-xs text-muted leading-relaxed mb-4">
            Beberapa argumen populer sering kali mengandung bias logika. Temuan kesalahan penalaran dalam debat publik mengenai topik ini meliputi:
          </p>
          
          <ul className="space-y-3.5">
            {result.fallacies.map((f, i) => (
              <li key={i} className="text-[13px] bg-surface/40 p-3 rounded-xl border border-border/40 hover:border-accent/30 transition-colors">
                <span className="font-semibold text-accent flex items-center gap-1.5">
                  <Info size={13} className="shrink-0" /> {f.name}
                </span>
                <p className="mt-1 text-muted/90 leading-relaxed pl-4.5 border-l border-border/60">
                  {f.explanation}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
