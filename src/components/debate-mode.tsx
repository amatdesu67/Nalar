import { Swords, ShieldAlert, Brain } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

function Position({ data, tone }: { data: AnalysisResult["debate"]["pro"]; tone: "pro" | "con" }) {
  const accent = tone === "pro" ? "border-pro/30" : "border-con/30";
  const dot = tone === "pro" ? "bg-pro" : "bg-con";
  return (
    <div className={`rounded-xl border ${accent} bg-surface/40 p-5`}>
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <h3 className="font-serif text-base text-fg">{tone === "pro" ? "Posisi PRO" : "Posisi KONTRA"}</h3>
      </div>
      <p className="mb-4 text-sm italic text-muted">{data.stance}</p>

      <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">Argumen</p>
      <ul className="mb-4 space-y-2">
        {data.arguments.map((a, i) => (
          <li key={i} className="flex gap-2 text-sm text-fg/90">
            <span className="text-muted">→</span>
            {a}
          </li>
        ))}
      </ul>

      <p className="mb-1.5 flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted">
        <ShieldAlert size={12} /> Kelemahan posisi ini
      </p>
      <ul className="space-y-2">
        {data.weaknesses.map((w, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted">
            <span>·</span>
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DebateMode({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-muted">
        <Swords size={16} className="text-accent" />
        <p className="text-sm">Argumen dua sisi disusun dari paper yang sama — lihat kelemahan masing-masing.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Position data={result.debate.pro} tone="pro" />
        <Position data={result.debate.con} tone="con" />
      </div>

      {result.fallacies.length > 0 && (
        <div className="rounded-xl border border-border bg-surface/40 p-5">
          <h3 className="mb-3 flex items-center gap-2 font-serif text-base text-fg">
            <Brain size={16} className="text-accent" /> Waspada kesalahan penalaran
          </h3>
          <ul className="space-y-3">
            {result.fallacies.map((f, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-accent">{f.name}</span>
                <span className="text-muted"> — {f.explanation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
