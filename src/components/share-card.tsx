"use client";
import { useRef, useState } from "react";
import { Share2, Download, Loader2, X } from "lucide-react";
import type { AnalysisResult, ConsensusLevel } from "@/lib/types";
import { CONSENSUS_LABEL, CONSENSUS_POS } from "@/lib/labels";
import { Button } from "@/components/ui/button";

// Warna brand eksplisit (hex) — bukan CSS var — agar render PNG konsisten
// tanpa tergantung resolusi variabel/font yang dimuat halaman.
const C = {
  bg: "#0d0b0a",
  surface: "#16130f",
  border: "#2a2520",
  fg: "#f5f0e6",
  muted: "#9a938b",
  accent: "#f6ae31",
  pro: "#1bbf86",
  con: "#ef3a4f",
};

type Format = "story" | "square";
const SIZES: Record<Format, { w: number; h: number; label: string }> = {
  story: { w: 1080, h: 1920, label: "Story 9:16" },
  square: { w: 1080, h: 1080, label: "Kotak 1:1" },
};

function consensusColor(c: ConsensusLevel): string {
  if (c === "strong_support" || c === "moderate_support") return C.pro;
  if (c === "strong_against" || c === "moderate_against") return C.con;
  return C.accent;
}

// Kartu visual yang akan dirender jadi PNG. Ukuran tetap dalam piksel.
function CardVisual({ result, format }: { result: AnalysisResult; format: Format }) {
  const { w, h } = SIZES[format];
  const isStory = format === "story";
  const color = consensusColor(result.consensus);
  const proCount = new Set(result.supporting.flatMap((e) => e.paperIds)).size;
  const conCount = new Set(result.opposing.flatMap((e) => e.paperIds)).size;
  const pos = CONSENSUS_POS[result.consensus];

  return (
    <div
      style={{
        width: w,
        height: h,
        background: C.bg,
        color: C.fg,
        fontFamily: "Georgia, 'Times New Roman', serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: isStory ? "120px 90px" : "80px 80px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow aksen */}
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -120,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
        }}
      />

      {/* Header brand */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: C.accent,
            color: C.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 34,
            fontFamily: "Georgia, serif",
          }}
        >
          N
        </div>
        <div>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>Nalar</div>
          <div style={{ fontSize: 19, color: C.muted, fontFamily: "Arial, sans-serif" }}>
            Mesin pencari bukti ilmiah
          </div>
        </div>
      </div>

      {/* Klaim + konsensus */}
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: isStory ? 56 : 36 }}>
        <div>
          <div style={{ fontSize: 20, color: C.muted, fontFamily: "Arial, sans-serif", letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>
            Klaim yang diuji
          </div>
          <div style={{ fontSize: isStory ? 56 : 46, fontWeight: 700, lineHeight: 1.25 }}>
            &ldquo;{result.question.length > 160 ? result.question.slice(0, 157) + "…" : result.question}&rdquo;
          </div>
        </div>

        <div>
          <div style={{ fontSize: isStory ? 64 : 52, fontWeight: 800, color, lineHeight: 1.1, marginBottom: 28 }}>
            {CONSENSUS_LABEL[result.consensus]}
          </div>
          {/* Spektrum */}
          <div style={{ position: "relative", height: 16, borderRadius: 999, background: `linear-gradient(90deg, ${C.con}55, ${C.muted}44, ${C.pro}55)`, border: `1px solid ${C.border}` }}>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: `${pos}%`,
                transform: "translate(-50%, -50%)",
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: C.bg,
                border: `4px solid ${color}`,
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 17, color: C.muted, fontFamily: "Arial, sans-serif", textTransform: "uppercase", letterSpacing: 2 }}>
            <span>Menentang</span>
            <span>Netral</span>
            <span>Mendukung</span>
          </div>
        </div>

        {/* Statistik */}
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { v: result.papersAnalyzed, l: "Paper dianalisis", c: C.accent },
            { v: proCount, l: "Mendukung", c: C.pro },
            { v: conCount, l: "Menentang", c: C.con },
            { v: `${result.confidence}%`, l: "Keyakinan", c: C.fg },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 22, padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: isStory ? 56 : 46, fontWeight: 800, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 18, color: C.muted, fontFamily: "Arial, sans-serif", marginTop: 6 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "Arial, sans-serif", fontSize: 22, color: C.muted, borderTop: `1px solid ${C.border}`, paddingTop: 32 }}>
        <span>Cek klaim apa pun dengan bukti akademik</span>
        <span style={{ color: C.accent, fontWeight: 700 }}>nalar.app</span>
      </div>
    </div>
  );
}

export function ShareCard({ result }: { result: AnalysisResult }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>("story");
  const [busy, setBusy] = useState<null | "download" | "share">(null);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const canShare = typeof navigator !== "undefined" && !!navigator.canShare;

  async function makeBlob(): Promise<Blob> {
    const node = cardRef.current;
    if (!node) throw new Error("Kartu belum siap");
    const { toBlob } = await import("html-to-image");
    // Render dua kali: pertama memuat font/layout, kedua hasil bersih.
    await toBlob(node, { pixelRatio: 1, cacheBust: true });
    const blob = await toBlob(node, { pixelRatio: 1, cacheBust: true });
    if (!blob) throw new Error("Gagal membuat gambar");
    return blob;
  }

  async function onDownload() {
    setBusy("download");
    setError(null);
    try {
      const blob = await makeBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nalar-${format}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat gambar");
    } finally {
      setBusy(null);
    }
  }

  async function onShare() {
    setBusy("share");
    setError(null);
    try {
      const blob = await makeBlob();
      const file = new File([blob], `nalar-${format}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Nalar — bukti ilmiah",
          text: `"${result.question}" — ${CONSENSUS_LABEL[result.consensus]}`,
        });
      } else {
        // Fallback: unduh saja.
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nalar-${format}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      // Pengguna membatalkan share bukan error yang perlu ditampilkan.
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setError(e instanceof Error ? e.message : "Gagal membagikan");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="border-border/60 hover:border-accent/40 hover:text-accent transition-all duration-300"
      >
        <Share2 size={13} />
        Bagikan
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border/60 bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-fg">Bagikan hasil</h3>
              <button onClick={() => setOpen(false)} className="text-muted/70 hover:text-fg">
                <X size={18} />
              </button>
            </div>

            {/* Pilih format */}
            <div className="mb-5 grid grid-cols-2 gap-2">
              {(Object.keys(SIZES) as Format[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    format === f
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-border/60 text-muted hover:border-accent/30"
                  }`}
                >
                  {SIZES[f].label}
                </button>
              ))}
            </div>

            {/* Pratinjau mini */}
            <div className="mb-5 flex justify-center">
              <div
                className="overflow-hidden rounded-xl border border-border/40"
                style={{ width: 180, height: format === "story" ? 320 : 180 }}
              >
                <div style={{ transform: `scale(${180 / 1080})`, transformOrigin: "top left" }}>
                  <CardVisual result={result} format={format} />
                </div>
              </div>
            </div>

            {error && <p className="mb-3 text-center text-xs text-con">{error}</p>}

            <div className="flex gap-2">
              <Button onClick={onDownload} disabled={!!busy} className="flex-1">
                {busy === "download" ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Unduh PNG
              </Button>
              {canShare && (
                <Button onClick={onShare} disabled={!!busy} variant="outline" className="flex-1 border-border/60">
                  {busy === "share" ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
                  Bagikan
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Target render PNG — di luar layar, ukuran penuh 1080px */}
      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
        <div ref={cardRef}>
          <CardVisual result={result} format={format} />
        </div>
      </div>
    </>
  );
}
