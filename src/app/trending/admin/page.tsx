"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Lock } from "lucide-react";
import { useTrending } from "@/lib/trending/use-trending";

export default function TrendingAdminPage() {
  const { items, ready, addClaim, removeClaim } = useTrending();
  const [claim, setClaim] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (claim.trim().length < 8) return;
    addClaim(claim, category, note);
    setClaim("");
    setCategory("");
    setNote("");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/trending" className="mb-8 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent">
        <ArrowLeft size={15} /> Lagi Ramai
      </Link>

      <h1 className="mb-1 font-serif text-2xl font-bold text-fg">Kelola Klaim Trending</h1>
      <p className="mb-6 text-sm text-muted">
        Input manual untuk MVP. Data disimpan di browser ini (localStorage).
      </p>

      {/* Form tambah */}
      <form onSubmit={submit} className="mb-8 space-y-3 rounded-2xl border border-border/60 bg-surface/20 p-5">
        <div>
          <label className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-muted">Klaim</label>
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            rows={2}
            placeholder="mis. Madu mentah menyembuhkan alergi musiman"
            className="w-full rounded-xl border border-border/60 bg-surface/30 px-3.5 py-2.5 text-[13px] text-fg placeholder:text-muted/50 outline-none focus:border-accent/40"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Kategori (mis. Kesehatan)"
            className="rounded-xl border border-border/60 bg-surface/30 px-3.5 py-2.5 text-[13px] text-fg placeholder:text-muted/50 outline-none focus:border-accent/40"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan (opsional)"
            className="rounded-xl border border-border/60 bg-surface/30 px-3.5 py-2.5 text-[13px] text-fg placeholder:text-muted/50 outline-none focus:border-accent/40"
          />
        </div>
        <button
          type="submit"
          disabled={claim.trim().length < 8}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent/15 border border-accent/30 px-4 py-2 text-[13px] font-semibold text-accent transition-colors hover:bg-accent/25 disabled:opacity-40"
        >
          <Plus size={15} /> Tambah klaim
        </button>
      </form>

      {/* Daftar */}
      {ready && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface/20 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-fg/90">{item.claim}</p>
                <p className="text-[11px] text-muted">
                  {item.category} · {item.count}× dicari
                </p>
              </div>
              {item.seeded ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-muted/50" title="Klaim bawaan tidak bisa dihapus">
                  <Lock size={12} /> bawaan
                </span>
              ) : (
                <button
                  onClick={() => removeClaim(item.id)}
                  className="shrink-0 text-muted/60 transition-colors hover:text-con"
                  aria-label="Hapus"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
