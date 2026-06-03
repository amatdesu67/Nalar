"use client";
import { useEffect, useState } from "react";
import { ExternalLink, Quote, ShieldCheck, AlertTriangle, BookOpen, Languages, Loader2 } from "lucide-react";
import type { Paper, QualityScore } from "@/lib/types";
import { STUDY_LABEL, QUALITY_COLOR } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { useTranslate } from "@/lib/use-translate";
import { CitationBox } from "@/components/citation-box";

export function PaperCard({
  paper,
  quality,
  index,
  autoTranslate = false,
}: {
  paper: Paper;
  quality?: QualityScore;
  index: number;
  autoTranslate?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const { translation, loading, error, translate } = useTranslate(paper.id, paper.abstract);

  // Toggle global "Tampilkan semua dalam Bahasa Indonesia".
  useEffect(() => {
    if (autoTranslate && paper.abstract) {
      setShowTranslation(true);
      translate();
    }
  }, [autoTranslate, paper.abstract, translate]);

  async function onTranslateClick() {
    if (translation) {
      setShowTranslation((v) => !v);
      return;
    }
    setShowTranslation(true);
    await translate();
  }

  const displayAbstract = showTranslation && translation ? translation : paper.abstract;

  return (
    <div
      className={
        paper.isRetracted
          ? "group glow-card rounded-2xl border border-con/50 bg-con/[0.06] p-5 transition-all duration-400"
          : "group glow-card rounded-2xl border border-border/60 bg-surface/20 p-5 transition-all duration-400 hover:border-accent/40 hover:bg-surface/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
      }
    >
      {/* Retraction banner — paper ditarik, dikecualikan dari konsensus */}
      {paper.isRetracted && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-con/40 bg-con/15 p-2.5">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-con" />
          <p className="text-[12px] font-semibold leading-relaxed text-con">
            Paper ini telah ditarik (retracted) — jangan dijadikan rujukan. Dikecualikan dari analisis konsensus.
          </p>
        </div>
      )}

      {/* Header: Index + Quality Score */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-muted/60 uppercase tracking-widest">
          <BookOpen size={12} className="text-accent/60" />
          Paper #{index + 1}
        </span>
        {quality && !paper.isRetracted && (
          <span
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold border transition-colors"
            style={{
              color: QUALITY_COLOR[quality.level],
              background: `${QUALITY_COLOR[quality.level]}0d`,
              borderColor: `${QUALITY_COLOR[quality.level]}30`,
            }}
          >
            {quality.level === "low" ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
            {quality.score}/100
          </span>
        )}
      </div>

      {/* Paper Title */}
      <a href={paper.url} target="_blank" rel="noopener noreferrer" className="block">
        <h4 className="font-serif text-[15px] font-semibold leading-snug text-fg/95 transition-colors duration-300 group-hover:text-accent line-clamp-3">
          {paper.title}
        </h4>
      </a>

      {/* Authors & Venue */}
      <p className="mt-2 line-clamp-1 text-[11px] text-muted/80 leading-relaxed">
        {paper.authors.slice(0, 3).join(", ")}
        {paper.authors.length > 3 ? " et al." : ""} · <span className="italic">{paper.venue ?? "—"}</span>
      </p>

      {/* Metadata Badges */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        {quality && (
          <Badge className="border-accent/25 text-accent bg-accent/5 font-bold text-[10px]">
            {STUDY_LABEL[quality.studyType]}
          </Badge>
        )}
        <Badge className="bg-surface/60 text-[10px]">{paper.year ?? "n.d."}</Badge>
        <Badge className="bg-surface/60 text-[10px]">
          <Quote size={9} /> {formatNumber(paper.citationCount)} sitasi
        </Badge>
        {paper.isOpenAccess && (
          <Badge className="border-pro/25 text-pro bg-pro/5 font-bold text-[10px]">
            ✓ Open Access
          </Badge>
        )}
        {quality?.peerReviewed && (
          <Badge className="bg-surface/60 text-[10px]">Peer-reviewed</Badge>
        )}
      </div>

      {/* Abstract + Terjemahan */}
      {paper.abstract && (
        <div className="mt-3.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted/60">
              Abstrak{showTranslation && translation ? " (ID)" : ""}
            </span>
            <button
              type="button"
              onClick={onTranslateClick}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted/70 transition-colors hover:text-accent disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={11} className="animate-spin" /> Menerjemahkan…
                </>
              ) : translation ? (
                <>
                  <Languages size={11} /> {showTranslation ? "Lihat asli" : "Lihat terjemahan"}
                </>
              ) : (
                <>
                  <Languages size={11} /> Terjemahkan
                </>
              )}
            </button>
          </div>
          <p
            className={`text-[12px] leading-relaxed text-muted/85 ${expanded ? "" : "line-clamp-4"}`}
          >
            {displayAbstract}
          </p>
          {error && <p className="mt-1 text-[11px] text-con/80">{error}</p>}
          {(displayAbstract?.length ?? 0) > 220 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-[11px] font-medium text-accent/80 transition-colors hover:text-accent"
            >
              {expanded ? "Ringkas" : "Selengkapnya"}
            </button>
          )}
        </div>
      )}

      {/* Quality Warnings */}
      {quality && quality.warnings.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-con/15 bg-con/5 p-2.5">
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-con/70" />
          <p className="text-[11px] text-con/75 leading-relaxed">
            {quality.warnings.join(" · ")}
          </p>
        </div>
      )}

      {/* Footer: DOI & Source Link */}
      <div className="mt-4 flex items-center gap-3 text-[10px] text-muted/60 border-t border-border/30 pt-3">
        {paper.doi && (
          <span className="font-mono truncate max-w-[200px]" title={paper.doi}>
            DOI: {paper.doi}
          </span>
        )}
        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 font-medium text-muted/70 transition-all duration-300 hover:text-accent hover:gap-2"
        >
          Buka Sumber <ExternalLink size={11} />
        </a>
      </div>

      {/* Export sitasi */}
      <CitationBox paper={paper} />
    </div>
  );
}
