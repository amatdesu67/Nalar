import { Skeleton } from "@/components/ui/skeleton";
import { Cpu, Database, ShieldCheck, Sparkles, Loader2 } from "lucide-react";

const STEPS = [
  { text: "Mengubah pertanyaan jadi keyword akademik…", icon: Cpu },
  { text: "Mencari paper relevan di OpenAlex…", icon: Database },
  { text: "Menilai kualitas tiap sumber…", icon: ShieldCheck },
  { text: "Menganalisis bukti dengan AI…", icon: Sparkles },
];

export function LoadingState({ step, elapsed = 0 }: { step: number; elapsed?: number }) {
  const slow = step >= STEPS.length - 1 && elapsed >= 12;

  return (
    <div className="animate-fade-up space-y-6">
      {/* Premium Loading Pipeline */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Ambient glow inside the card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-accent/8 rounded-full filter blur-3xl pointer-events-none" />

        <div className="relative space-y-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isComplete = i < step;
            const isActive = i === step;
            const isPending = i > step;

            return (
              <div key={i} className="flex items-stretch gap-4">
                {/* Vertical connector + Node */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold transition-all duration-500 ${
                      isComplete
                        ? "bg-pro/15 text-pro border border-pro/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                        : isActive
                          ? "bg-accent/15 text-accent border border-accent/40 shadow-[0_0_18px_hsl(var(--accent)/0.25)] animate-pulse"
                          : "bg-surface/40 text-muted/40 border border-border/40"
                    }`}
                  >
                    {isComplete ? (
                      "✓"
                    ) : isActive ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Icon size={14} />
                    )}
                  </div>
                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div
                      className={`w-0.5 flex-1 min-h-[12px] my-1 rounded-full transition-colors duration-500 ${
                        isComplete ? "bg-pro/30" : "bg-border/40"
                      }`}
                    />
                  )}
                </div>

                {/* Step Label */}
                <div className={`flex items-center pb-3 transition-all duration-500 ${isPending ? "opacity-35" : ""}`}>
                  <p
                    className={`text-[13px] font-medium leading-snug ${
                      isComplete ? "text-fg/80" : isActive ? "text-fg" : "text-muted/50"
                    }`}
                  >
                    {s.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Slow processing message */}
        {slow && (
          <div className="mt-4 border-t border-border/40 pt-3 flex items-center gap-2">
            <Loader2 size={13} className="animate-spin text-accent" />
            <p className="text-xs text-muted/80 leading-relaxed">
              Masih memproses paper… analisa kompleks bisa memakan waktu hingga ~30 detik.
              <span className="font-mono text-accent/80 ml-1.5">({elapsed}s)</span>
            </p>
          </div>
        )}
      </div>

      {/* Premium Skeleton Placeholders */}
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

