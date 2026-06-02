import { ExternalLink, Quote, ShieldCheck, AlertTriangle, BookOpen } from "lucide-react";
import type { Paper, QualityScore } from "@/lib/types";
import { STUDY_LABEL, QUALITY_COLOR } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

export function PaperCard({ paper, quality, index }: { paper: Paper; quality?: QualityScore; index: number }) {
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
    </div>
  );
}
