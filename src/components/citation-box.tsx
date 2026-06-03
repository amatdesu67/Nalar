"use client";
import { useState } from "react";
import { Quote, Copy, Check } from "lucide-react";
import type { Paper } from "@/lib/types";
import { formatCitation, CITE_LABEL, type CiteFormat } from "@/lib/cite";

const FORMATS: CiteFormat[] = ["bibtex", "apa", "mla"];

export function CitationBox({ paper }: { paper: Paper }) {
  const [open, setOpen] = useState(false);
  const [fmt, setFmt] = useState<CiteFormat>("apa");
  const [copied, setCopied] = useState(false);

  const text = formatCitation(paper, fmt);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard ditolak (mis. konteks non-HTTPS) — abaikan diam-diam.
    }
  }

  return (
    <div className="mt-3 border-t border-border/30 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted/70 transition-colors hover:text-accent"
      >
        <Quote size={12} /> {open ? "Tutup sitasi" : "Kutip"}
      </button>

      {open && (
        <div className="mt-2.5 space-y-2">
          <div className="flex items-center gap-1.5">
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFmt(f)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-colors ${
                  fmt === f
                    ? "bg-accent/15 text-accent"
                    : "text-muted/70 hover:text-fg"
                }`}
              >
                {CITE_LABEL[f]}
              </button>
            ))}
            <button
              type="button"
              onClick={copy}
              className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-muted/70 transition-colors hover:text-accent"
            >
              {copied ? <Check size={11} className="text-pro" /> : <Copy size={11} />}
              {copied ? "Tersalin" : "Salin"}
            </button>
          </div>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border/40 bg-bg/40 p-2.5 font-mono text-[10.5px] leading-relaxed text-muted/90">
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}
