"use client";
import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { buildTimeline, type YearBucket } from "@/lib/timeline";

function Segment({ value, total, color }: { value: number; total: number; color: string }) {
  if (value === 0) return null;
  return (
    <div
      style={{ height: `${(value / total) * 100}%`, background: color }}
      className="w-full first:rounded-t-sm transition-all duration-500"
    />
  );
}

export function ConsensusTimeline({ result }: { result: AnalysisResult }) {
  const timeline = useMemo(() => buildTimeline(result), [result]);
  const [active, setActive] = useState<YearBucket | null>(null);

  // Timeline baru bermakna bila ada rentang minimal 2 tahun.
  if (timeline.buckets.length < 2 || !timeline.span) return null;

  const { buckets, maxTotal, span } = timeline;

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/20 p-5">
      <div className="mb-1 flex items-center justify-between">
        <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
          <TrendingUp size={13} className="text-accent" /> Timeline Konsensus
        </p>
        <span className="font-mono text-[10px] text-muted/70">
          {span.from}–{span.to}
        </span>
      </div>
      <p className="mb-4 text-[12px] leading-relaxed text-muted/80">
        Distribusi paper per tahun. Tinggi batang = jumlah paper; warna = rasio mendukung vs menentang.
      </p>

      {/* Bars */}
      <div className="flex h-32 items-end gap-1.5">
        {buckets.map((b) => {
          const isActive = active?.year === b.year;
          return (
            <button
              key={b.year}
              type="button"
              onMouseEnter={() => setActive(b)}
              onMouseLeave={() => setActive((cur) => (cur?.year === b.year ? null : cur))}
              onFocus={() => setActive(b)}
              className="group flex h-full flex-1 flex-col justify-end"
              title={`${b.year}: ${b.pro} mendukung · ${b.con} menentang · ${b.neutral} netral`}
            >
              <div
                style={{ height: `${Math.max((b.total / maxTotal) * 100, 6)}%` }}
                className={`flex w-full flex-col-reverse overflow-hidden rounded-sm border-b-2 transition-all duration-300 ${
                  isActive ? "border-accent ring-1 ring-accent/40" : "border-transparent group-hover:border-accent/40"
                }`}
              >
                <Segment value={b.con} total={b.total} color="hsl(var(--con) / 0.85)" />
                <Segment value={b.neutral} total={b.total} color="hsl(var(--muted) / 0.4)" />
                <Segment value={b.pro} total={b.total} color="hsl(var(--pro) / 0.85)" />
              </div>
            </button>
          );
        })}
      </div>

      {/* X-axis (tampilkan subset label bila tahun banyak) */}
      <div className="mt-2 flex gap-1.5">
        {buckets.map((b, i) => {
          const step = Math.ceil(buckets.length / 8);
          const show = i % step === 0 || i === buckets.length - 1;
          return (
            <span key={b.year} className="flex-1 text-center font-mono text-[9px] text-muted/60">
              {show ? `'${String(b.year).slice(2)}` : ""}
            </span>
          );
        })}
      </div>

      {/* Detail tahun aktif + legenda */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3">
        <div className="flex items-center gap-3 font-mono text-[10px] text-muted/80">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-pro/85" /> Mendukung
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-muted/40" /> Netral
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-con/85" /> Menentang
          </span>
        </div>
        {active && (
          <p className="font-mono text-[11px] text-fg/90">
            <span className="text-accent">{active.year}</span> · {active.total} paper
            {" "}(<span className="text-pro">{active.pro}</span>/
            <span className="text-muted">{active.neutral}</span>/
            <span className="text-con">{active.con}</span>)
          </p>
        )}
      </div>
    </div>
  );
}
