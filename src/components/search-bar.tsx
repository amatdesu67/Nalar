"use client";
import { useState } from "react";
import { Search, Loader2, CornerDownLeft } from "lucide-react";

const EXAMPLES = [
  "Apakah video game menyebabkan kekerasan?",
  "Apakah AI akan menggantikan programmer?",
  "Apakah puasa meningkatkan kesehatan?",
  "Apakah evolusi didukung bukti ilmiah?",
];

export function SearchBar({
  onSearch,
  loading,
  value,
  onChange,
}: {
  onSearch: (q: string) => void;
  loading: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  const submit = () => {
    if (value.trim().length >= 5 && !loading) onSearch(value.trim());
  };

  return (
    <div className="w-full space-y-4">
      {/* Premium Search Container */}
      <div
        className={`flex items-center gap-3.5 rounded-2xl border bg-surface/30 px-5 py-4 backdrop-blur-xl transition-all duration-500 ${
          focused
            ? "border-accent/70 shadow-[0_0_25px_hsl(var(--accent)/0.12)] bg-surface/40 scale-[1.005]"
            : "border-border/80"
        }`}
      >
        <Search 
          size={20} 
          className={`shrink-0 transition-colors duration-300 ${
            focused ? "text-accent" : "text-muted"
          }`} 
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Tanyakan klaim atau topik debat apa pun…"
          disabled={loading}
          className="flex-1 bg-transparent text-[16px] text-fg outline-none placeholder:text-muted/70 disabled:opacity-60 font-sans"
        />
        <button
          onClick={submit}
          disabled={loading || value.trim().length < 5}
          className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent/90 px-4 text-xs font-semibold uppercase tracking-wider text-bg transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_4px_16px_hsl(var(--accent)/0.25)] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 disabled:hover:shadow-none shrink-0"
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <CornerDownLeft size={14} className="transition-transform group-hover:translate-x-0.5" />
          )}
          {loading ? "Proses" : "Uji Klaim"}
        </button>
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted/60 mr-1.5 font-bold">
          Topik Populer:
        </span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              onChange(ex);
              onSearch(ex);
            }}
            disabled={loading}
            className="rounded-full border border-border/60 bg-surface/20 px-3.5 py-1.5 text-xs text-muted/90 transition-all duration-300 hover:border-accent/40 hover:text-accent hover:bg-accent/5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-transparent"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
