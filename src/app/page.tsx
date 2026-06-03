"use client";
import { useState, useRef, useEffect } from "react";
import { FlaskConical, History, BarChart3, Trash2, AlertTriangle, Search, Download, Upload, GitCompare } from "lucide-react";
import type { AnalysisResult, ApiError } from "@/lib/types";
import { CONSENSUS_LABEL } from "@/lib/labels";
import { SearchBar } from "@/components/search-bar";
import { LoadingState } from "@/components/loading-state";
import { ResultView } from "@/components/result-view";
import { CompareView } from "@/components/compare-view";
import { useHistory } from "@/lib/use-history";
import { readCache, writeCache } from "@/lib/result-cache";

export default function Home() {
  const [mode, setMode] = useState<"single" | "compare">("single");
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

  const recordHistory = (data: AnalysisResult) =>
    add({
      question: data.question,
      consensus: data.consensus,
      confidence: data.confidence,
      papers: data.papersAnalyzed,
    });

  const run = async (q: string) => {
    setError(null);

    // Stale-while-revalidate: tampilkan hasil tersimpan dulu (instan, hemat API).
    // Fresh → langsung pakai tanpa fetch. Stale → tampilkan lalu validasi ulang.
    const cached = readCache(q);
    if (cached) {
      setResult(cached.result);
      recordHistory(cached.result);
      if (!cached.stale) return; // masih segar — tidak perlu memanggil API
    }

    setLoading(!cached); // saat ada cache stale, revalidasi diam-diam di latar
    if (!cached) setResult(null);
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
      writeCache(q, data);
      if (!cached) recordHistory(data); // saat revalidasi cache, jangan dobel di riwayat
    } catch (e) {
      // Saat revalidasi cache stale gagal, biarkan hasil lama tetap tampil tanpa error.
      if (cached) {
        // diam: pengguna sudah melihat hasil tersimpan.
      } else {
        // Bedakan gangguan jaringan dari error server agar pesannya membantu.
        const msg = e instanceof Error ? e.message : "";
        if (e instanceof TypeError || /failed to fetch|network/i.test(msg)) {
          setError("Tidak bisa terhubung ke server. Cek koneksi internet kamu, lalu coba lagi.");
        } else {
          setError(msg || "Terjadi kesalahan tak terduga. Coba lagi.");
        }
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
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Ambient premium glows */}
      <div className="ambient-glow ambient-glow-amber" />
      <div className="ambient-glow ambient-glow-pro" />

      {/* Futuristic technical grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.2)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 md:flex-row md:py-12">
        {/* Main Content Area */}
        <main className="min-w-0 flex-1 space-y-8">
          {/* Brand Premium Header */}
          <header className="relative flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 shadow-[0_0_15px_hsl(var(--accent)/0.15)] transition-transform duration-300 hover:scale-105">
                <FlaskConical size={20} className="text-accent" />
                <span className="absolute inset-0 rounded-xl bg-accent/5 animate-pulse" />
              </span>
              <div>
                <h1 className="font-serif text-2xl font-semibold tracking-wider text-fg leading-none">Nalar</h1>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-accent/80 font-bold">
                  Mesin Pencari Bukti Ilmiah
                </p>
              </div>
            </div>
            
            {!result && !loading && (
              <div className="animate-fade-up space-y-3">
                <h2 className="max-w-2xl font-serif text-3xl font-bold tracking-tight text-gradient-gold md:text-4xl leading-tight">
                  Berargumen dengan Bukti, Bukan Opini.
                </h2>
                <p className="max-w-xl text-[14px] leading-relaxed text-muted">
                  Cari jawaban berbasis paper akademik global. Uji keabsahan klaim, opini, dan topik debat secara objektif dengan dukungan data netral, analisis dua sisi, tingkat konsensus, dan penilaian kualitas sumber — langsung dari database 250 juta+ paper terindeks.
                </p>
              </div>
            )}
          </header>

          {/* Mode toggle: Cari vs Bandingkan */}
          <div className="inline-flex rounded-xl border border-border/60 bg-surface/20 p-1">
            <button
              onClick={() => setMode("single")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                mode === "single" ? "bg-accent/15 text-accent" : "text-muted hover:text-fg"
              }`}
            >
              <Search size={13} /> Cari
            </button>
            <button
              onClick={() => setMode("compare")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                mode === "compare" ? "bg-accent/15 text-accent" : "text-muted hover:text-fg"
              }`}
            >
              <GitCompare size={13} /> Bandingkan
            </button>
          </div>

          {/* Search Engine Area */}
          <div className="glass-panel rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full filter blur-xl pointer-events-none transition-opacity group-hover:bg-accent/8" />
            {mode === "single" ? (
              <SearchBar onSearch={run} loading={loading} value={query} onChange={setQuery} />
            ) : (
              <CompareView />
            )}
          </div>

          {/* Results Area (mode tunggal) */}
          {mode === "single" && (
            <div className="mt-8">
              {loading && <LoadingState step={step} elapsed={elapsed} />}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-con/30 bg-con/5 p-4 text-sm text-con animate-fade-up">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-con" />
                  <div>
                    <p className="font-semibold text-[15px]">Gagal menganalisis</p>
                    <p className="mt-1 text-con/80 leading-relaxed">{error}</p>
                  </div>
                </div>
              )}
              {result && !loading && <ResultView result={result} onReset={reset} />}
            </div>
          )}
        </main>

        {/* Sidebar Widgets */}
        <aside className="w-full shrink-0 space-y-6 md:w-76">
          {/* Database & Usage Statistics */}
          <div className="glass-panel glow-card rounded-2xl p-5 shadow-lg">
            <p className="mb-4 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
              <BarChart3 size={14} className="text-accent" /> Statistik Penggunaan
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-r border-border/40">
                <p className="font-serif text-3xl font-bold text-fg text-gradient-gold">{items.length}</p>
                <p className="mt-1 text-[11px] text-muted">pencarian sukses</p>
              </div>
              <div className="pl-2">
                <p className="font-serif text-3xl font-bold text-fg text-gradient-gold">{totalPapers}</p>
                <p className="mt-1 text-[11px] text-muted">paper dianalisis</p>
              </div>
            </div>
          </div>

          {/* Search History Panel */}
          <div className="glass-panel glow-card rounded-2xl p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
                <History size={14} className="text-accent" /> Riwayat Pencarian
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInput.current?.click()}
                  className="text-muted transition-colors hover:text-accent p-1 hover:bg-surface/60 rounded-md"
                  title="Pulihkan riwayat dari file backup"
                >
                  <Upload size={14} />
                </button>
                {items.length > 0 && (
                  <>
                    <button
                      onClick={exportData}
                      className="text-muted transition-colors hover:text-accent p-1 hover:bg-surface/60 rounded-md"
                      title="Unduh backup riwayat (.json)"
                    >
                      <Download size={14} />
                    </button>
                    <button 
                      onClick={clear} 
                      className="text-muted transition-colors hover:text-con p-1 hover:bg-surface/60 rounded-md" 
                      title="Hapus riwayat"
                    >
                      <Trash2 size={14} />
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
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Search size={22} className="text-muted/30 animate-pulse" />
                <p className="text-xs font-medium text-fg/80">Belum ada riwayat</p>
                <p className="text-[11px] leading-relaxed text-muted/60 max-w-[200px]">
                  Hasil pencarian ilmiah Anda akan tersimpan di sini secara otomatis.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <ul className={`space-y-2.5 ${showAll ? "max-h-80 overflow-y-auto pr-1" : ""}`}>
                  {(showAll ? items : items.slice(0, 6)).map((h) => (
                    <li key={h.id} className="group/item">
                      <button
                        onClick={() => {
                          setQuery(h.question);
                          run(h.question);
                        }}
                        className="w-full rounded-xl border border-border/40 bg-surface/20 p-2.5 text-left transition-all hover:border-accent/40 hover:bg-surface/50 hover:shadow-[0_2px_12px_rgba(0,0,0,0.2)] group-hover/item:translate-x-0.5 duration-300"
                      >
                        <p className="line-clamp-2 text-[12px] font-medium text-fg/90 group-hover:text-accent transition-colors">
                          {h.question}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted">
                          <span className="font-serif italic text-accent/90">
                            {CONSENSUS_LABEL[h.consensus as keyof typeof CONSENSUS_LABEL] ?? h.consensus}
                          </span>
                          <span className="font-mono bg-surface/80 px-1.5 py-0.5 rounded border border-border/30">
                            {h.confidence}% keyakinan
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                
                {items.length > 6 && (
                  <button
                    onClick={() => setShowAll((v) => !v)}
                    className="mt-2 w-full rounded-xl border border-border/80 bg-surface/10 py-2 text-[11px] font-medium text-muted transition-all hover:border-accent/40 hover:text-fg hover:bg-surface/30"
                  >
                    {showAll ? "Tampilkan lebih sedikit" : `Lihat semua riwayat (${items.length})`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Academic Footer Disclaimer */}
          <div className="glass-panel rounded-2xl p-4 bg-surface/20">
            <p className="text-[10px] leading-relaxed text-muted/70">
              Nalar menyusun ringkasan sintetis dari abstrak paper publik yang diindeks oleh **OpenAlex**. Hasil analisis AI ditujukan untuk membantu kajian literatur ilmiah, bukan pengganti nasehat profesional medis, hukum, atau keuangan. Selalu verifikasi ke sumber asli.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
