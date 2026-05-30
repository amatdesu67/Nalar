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
    <div className="w-full">
      <div
        className={`flex items-center gap-3 rounded-2xl border bg-surface/70 px-4 py-3.5 backdrop-blur transition-all ${
          focused ? "border-accent/60 shadow-[0_0_0_4px_hsl(var(--accent)/0.08)]" : "border-border"
        }`}
      >
        <Search size={20} className="shrink-0 text-muted" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Tanyakan klaim atau topik debat apa pun…"
          disabled={loading}
          className="flex-1 bg-transparent text-base text-fg outline-none placeholder:text-muted disabled:opacity-60"
        />
        <button
          onClick={submit}
          disabled={loading || value.trim().length < 5}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3.5 text-sm font-medium text-bg transition hover:brightness-110 disabled:opacity-40"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <CornerDownLeft size={15} />}
          {loading ? "Menganalisis" : "Cari"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              onChange(ex);
              onSearch(ex);
            }}
            disabled={loading}
            className="rounded-full border border-border bg-surface/40 px-3 py-1 text-xs text-muted transition hover:border-accent/40 hover:text-fg disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
