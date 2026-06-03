"use client";
import Link from "next/link";
import { Flame, ArrowRight, Settings2, ArrowLeft, Search } from "lucide-react";
import { useTrending } from "@/lib/trending/use-trending";

export default function TrendingPage() {
  const { items, ready } = useTrending();

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent">
          <ArrowLeft size={15} /> Beranda
        </Link>
        <Link
          href="/trending/admin"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:text-accent"
        >
          <Settings2 size={13} /> Kelola
        </Link>
      </div>

      <header className="mb-8 space-y-2">
        <h1 className="flex items-center gap-2.5 font-serif text-3xl font-bold text-gradient-gold">
          <Flame size={26} className="text-accent" /> Lagi Ramai
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          Klaim & hoaks yang sedang banyak beredar. Klik untuk langsung dianalisa Nalar dengan bukti ilmiah.
        </p>
      </header>

      {!ready ? (
        <p className="text-sm text-muted">Memuat…</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={item.id}>
              <Link
                href={`/?q=${encodeURIComponent(item.claim)}`}
                className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-surface/20 p-4 transition-all hover:border-accent/40 hover:bg-surface/40"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-serif text-sm font-bold text-accent">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium leading-snug text-fg/90 group-hover:text-accent">
                    {item.claim}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                    <span className="rounded-full bg-surface/60 px-2 py-0.5 font-mono">{item.category}</span>
                    <span className="inline-flex items-center gap-1">
                      <Search size={10} /> {item.count}× dicari
                    </span>
                    {item.note && <span className="italic text-muted/70">· {item.note}</span>}
                  </div>
                </div>
                <ArrowRight size={16} className="shrink-0 text-muted/50 transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
