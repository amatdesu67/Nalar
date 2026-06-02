import type { ConsensusLevel } from "@/lib/types";
import { CONSENSUS_LABEL, CONSENSUS_POS } from "@/lib/labels";
import { Award, BookOpen, ShieldCheck } from "lucide-react";

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
  
  // Circumference for SVG Radial Gauge (radius = 32)
  const radius = 32;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  return (
    <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden group">
      {/* Dynamic light highlight in the background */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-accent/5 rounded-full filter blur-xl pointer-events-none" />

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        
        {/* Left Section: Consensus Track */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
              <Award size={14} className="text-accent" /> Kesimpulan Konsensus
            </h3>
            <span className="flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 font-mono text-[11px] text-accent">
              <BookOpen size={11} /> {papers} paper dianalisis
            </span>
          </div>

          <div className="space-y-1">
            <p className="font-serif text-2xl font-bold tracking-tight text-gradient-gold">
              {CONSENSUS_LABEL[consensus]}
            </p>
            <p className="text-xs text-muted leading-relaxed">
              Ditentukan berdasarkan keseimbangan klaim, intensitas kutipan, dan kredibilitas publikasi paper akademik yang relevan.
            </p>
          </div>

          {/* Luxury Consensus Spectrum Slider */}
          <div className="space-y-2 pt-2">
            <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-con/30 via-muted/20 to-pro/30 border border-border/40">
              {/* Glowing anchor dots */}
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-con/70" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-muted/50" />
              <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-pro/70" />
              
              {/* Floating pulsing slider pointer */}
              <div
                className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-bg shadow-[0_0_12px_hsl(var(--accent)/0.6)] flex items-center justify-center transition-all duration-1000 ease-out"
                style={{ left: `${pos}%` }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping absolute" />
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </div>
            </div>
            <div className="flex justify-between font-mono text-[9px] font-bold uppercase tracking-widest text-muted/70">
              <span className="hover:text-con transition-colors">Menentang</span>
              <span className="hover:text-fg transition-colors">Netral</span>
              <span className="hover:text-pro transition-colors">Mendukung</span>
            </div>
          </div>
        </div>

        {/* Right Section: Circular Radial Gauge for Scientific Confidence */}
        <div className="flex items-center gap-4 border-t border-border/40 pt-4 md:border-t-0 md:border-l md:border-border/40 md:pt-0 md:pl-6 shrink-0 justify-between md:justify-start">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
              <ShieldCheck size={14} className="text-accent" /> Nilai Keyakinan
            </p>
            <p className="text-xs text-muted/80 max-w-[150px] leading-normal">
              Akurasi inferensi bukti berdasarkan koherensi klaim.
            </p>
          </div>

          {/* SVG Radial Gauge */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
              <defs>
                <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--accent))" />
                  <stop offset="100%" stopColor="hsl(38 100% 70%)" />
                </linearGradient>
              </defs>
              {/* Background ring */}
              <circle
                stroke="hsl(var(--border) / 0.8)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              {/* Glowing active ring */}
              <circle
                stroke="url(#gold-gradient)"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + " " + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="transition-all duration-1000 ease-out shadow-lg"
              />
            </svg>
            <span className="absolute font-serif text-[15px] font-bold text-fg">
              {confidence}%
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
