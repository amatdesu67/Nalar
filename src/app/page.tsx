"use client";
import { useState, useRef, useEffect } from "react";
import { FlaskConical, History, BarChart3, Trash2, AlertTriangle, Search, Download, Upload } from "lucide-react";
import type { AnalysisResult, ApiError } from "@/lib/types";
import { CONSENSUS_LABEL } from "@/lib/labels";
import { SearchBar } from "@/components/search-bar";
import { LoadingState } from "@/components/loading-state";
import { ResultView } from "@/components/result-view";
import { useHistory } from "@/lib/use-history";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { items, add, clear, exportData, importData } = useHistory();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset agar file yang sama bisa dipilih lagi
    if (!file) return;
    try {
      await importData(file);
      setError(null);
    } catch {
      setError("Gagal memuat file riwayat. Pastikan itu file backup .json dari Nalar.");
    }
  };

  useEffect(() => () => void (timer.current && clearInterval(timer.current)), []);

  const run = async (q: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setStep(0);
    setElapsed(0);
    // Satu timer untuk progres langkah (perkiraan) + hitung detik berlalu,
    // dipakai untuk pesan "masih memproses" saat respons lama.
    timer.current && clearInterval(timer.current);
    const start = Date.now();
    timer.current = setInterval(() => {
      const sec = (Date.now() - start) / 1000;
      setElapsed(Math.floor(sec));
      setStep(Math.min(Math.floor(sec / 2.6), 3));
    }, 500);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json()) as AnalysisResult | ApiError;
      if (!res.ok || "error" in data) throw new Error(("error" in data && data.error) || "Gagal menganalisis.");
      setResult(data);
      add({
        question: data.question,
        consensus: data.consensus,
        confidence: data.confidence,
        papers: data.papersAnalyzed,
      });
    } catch (e) {
      // Bedakan gangguan jaringan dari error server agar pesannya membantu.
      const msg = e instanceof Error ? e.message : "";
      if (e instanceof TypeError || /failed to fetch|network/i.test(msg)) {
        setError("Tidak bisa terhubung ke server. Cek koneksi internet kamu, lalu coba lagi.");
      } else {
        setError(msg || "Terjadi kesalahan tak terduga. Coba lagi.");
      }
    } finally {
      timer.current && clearInterval(timer.current);
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPapers = items.reduce((a, b) => a + b.papers, 0);

  return (
    <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:py-12">
      {/* Main */}
      <main className="min-w-0 flex-1">
        <header className="mb-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <FlaskConical size={20} />
            </span>
            <div>
              <h1 className="font-serif text-2xl leading-none text-fg">Nalar</h1>
              <p className="text-xs text-muted">Berargumen dengan bukti</p>
            </div>
          </div>
          {!result && !loading && (
            <p className="mt-6 max-w-xl font-serif text-xl leading-snug text-fg/80">
              Cari jawaban berbasis paper akademik. Lihat kedua sisi argumen, kualitas sumber, dan tingkat konsensus
              ilmiah — tanpa upload PDF.
            </p>
          )}
        </header>

        <SearchBar onSearch={run} loading={loading} value={query} onChange={setQuery} />

        <div className="mt-8">
          {loading && <LoadingState step={step} elapsed={elapsed} />}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-con/30 bg-con/5 p-4 text-sm text-con">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Gagal menganalisis</p>
                <p className="text-con/80">{error}</p>
              </div>
            </div>
          )}
          {result && !loading && <ResultView result={result} onReset={reset} />}
        </div>
      </main>

      {/* Sidebar: statistik + riwayat */}
      <aside className="w-full shrink-0 space-y-5 md:w-72">
        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <p className="mb-3 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
            <BarChart3 size={13} /> Statistik
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-serif text-2xl text-fg">{items.length}</p>
              <p className="text-xs text-muted">pencarian</p>
            </div>
            <div>
              <p className="font-serif text-2xl text-fg">{totalPapers}</p>
              <p className="text-xs text-muted">paper dianalisis</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted">
              <History size={13} /> Riwayat
            </p>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => fileInput.current?.click()}
                className="text-muted transition hover:text-accent"
                title="Pulihkan riwayat dari file backup"
              >
                <Upload size={13} />
              </button>
              {items.length > 0 && (
                <>
                  <button
                    onClick={exportData}
                    className="text-muted transition hover:text-accent"
                    title="Unduh backup riwayat (.json)"
                  >
                    <Download size={13} />
                  </button>
                  <button onClick={clear} className="text-muted transition hover:text-con" title="Hapus riwayat">
                    <Trash2 size={13} />
                  </button>
                </>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                onChange={onImportFile}
                className="hidden"
              />
            </div>
          </div>
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-4 text-center">
              <Search size={20} className="text-muted/40" />
              <p className="text-xs text-muted">Belum ada pencarian.</p>
              <p className="text-[11px] leading-relaxed text-muted/60">
                Hasil analisamu otomatis tersimpan di sini. Coba salah satu contoh di atas untuk memulai.
              </p>
            </div>
          ) : (
            <>
              <ul className={`space-y-2 ${showAll ? "max-h-80 overflow-y-auto pr-1" : ""}`}>
                {(showAll ? items : items.slice(0, 8)).map((h) => (
                  <li key={h.id}>
                    <button
                      onClick={() => {
                        setQuery(h.question);
                        run(h.question);
                      }}
                      className="w-full rounded-lg border border-transparent p-2 text-left transition hover:border-border hover:bg-surface"
                    >
                      <p className="line-clamp-2 text-xs text-fg/90">{h.question}</p>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {CONSENSUS_LABEL[h.consensus as keyof typeof CONSENSUS_LABEL] ?? h.consensus} · {h.confidence}%
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
              {items.length > 8 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="mt-2 w-full rounded-lg border border-border/60 py-1.5 text-[11px] text-muted transition hover:border-accent/40 hover:text-fg"
                >
                  {showAll ? "Tampilkan lebih sedikit" : `Lihat semua (${items.length})`}
                </button>
              )}
            </>
          )}
        </div>

        <p className="px-1 text-[10px] leading-relaxed text-muted/70">
          Nalar menyusun ringkasan dari abstrak paper publik (OpenAlex). Selalu verifikasi ke sumber asli sebelum
          mengambil keputusan penting.
        </p>
      </aside>
    </div>
  );
}
