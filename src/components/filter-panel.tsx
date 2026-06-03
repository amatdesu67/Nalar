"use client";
import { Quote } from "lucide-react";
import type { PaperFilters, FilterBounds } from "@/lib/filter-papers";
import { formatNumber } from "@/lib/utils";

export function FilterPanel({
  bounds,
  filters,
  onChange,
  onReset,
}: {
  bounds: FilterBounds;
  filters: PaperFilters;
  onChange: (f: PaperFilters) => void;
  onReset: () => void;
}) {
  const set = (patch: Partial<PaperFilters>) => onChange({ ...filters, ...patch });

  const toggleField = (field: string) => {
    const has = filters.fields.includes(field);
    set({ fields: has ? filters.fields.filter((f) => f !== field) : [...filters.fields, field] });
  };

  const yMin = filters.yearMin ?? bounds.minYear ?? 0;
  const yMax = filters.yearMax ?? bounds.maxYear ?? 0;

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/20 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted">Filter hasil</span>
        <button onClick={onReset} className="text-[11px] font-medium text-muted/70 transition-colors hover:text-accent">
          Reset
        </button>
      </div>

      {/* Open access */}
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="text-[13px] text-fg/90">Hanya open access</span>
        <button
          type="button"
          role="switch"
          aria-checked={filters.openAccessOnly}
          onClick={() => set({ openAccessOnly: !filters.openAccessOnly })}
          className={`relative h-5 w-9 rounded-full transition-colors ${filters.openAccessOnly ? "bg-accent" : "bg-border"}`}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-bg transition-all ${filters.openAccessOnly ? "left-[18px]" : "left-0.5"}`} />
        </button>
      </label>

      {/* Min sitasi */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-fg/90">Minimal sitasi</span>
          <span className="font-mono text-accent">{formatNumber(filters.minCitations)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={bounds.maxCitations}
          value={filters.minCitations}
          onChange={(e) => set({ minCitations: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </div>

      {/* Rentang tahun */}
      {bounds.minYear != null && bounds.maxYear != null && bounds.minYear !== bounds.maxYear && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-fg/90">Rentang tahun</span>
            <span className="font-mono text-accent">{yMin}–{yMax}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={bounds.minYear}
              max={bounds.maxYear}
              value={yMin}
              onChange={(e) => set({ yearMin: Math.min(Number(e.target.value), yMax) })}
              className="w-full accent-accent"
              aria-label="Tahun minimal"
            />
            <input
              type="range"
              min={bounds.minYear}
              max={bounds.maxYear}
              value={yMax}
              onChange={(e) => set({ yearMax: Math.max(Number(e.target.value), yMin) })}
              className="w-full accent-accent"
              aria-label="Tahun maksimal"
            />
          </div>
        </div>
      )}

      {/* Bidang ilmu */}
      {bounds.fields.length > 0 && (
        <div className="space-y-2">
          <span className="flex items-center gap-1.5 text-[13px] text-fg/90">
            <Quote size={12} className="text-accent/60" /> Bidang ilmu
          </span>
          <div className="flex flex-wrap gap-1.5">
            {bounds.fields.map((f) => {
              const on = filters.fields.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleField(f)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    on ? "border-accent/50 bg-accent/10 text-accent" : "border-border/60 text-muted hover:border-accent/30"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
