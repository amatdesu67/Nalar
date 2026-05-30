import { ExternalLink, Quote, ShieldCheck, AlertTriangle } from "lucide-react";
import type { Paper, QualityScore } from "@/lib/types";
import { STUDY_LABEL, QUALITY_COLOR } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";

export function PaperCard({ paper, quality, index }: { paper: Paper; quality?: QualityScore; index: number }) {
  return (
    <div className="group rounded-xl border border-border bg-surface/40 p-4 transition-colors hover:border-accent/40">
      <div className="flex items-start justify-between gap-3">
        <span className="mt-0.5 font-mono text-xs text-muted">[{index + 1}]</span>
        {quality && (
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium"
            style={{ color: QUALITY_COLOR[quality.level], background: `${QUALITY_COLOR[quality.level]}1a` }}
          >
            {quality.level === "low" ? <AlertTriangle size={11} /> : <ShieldCheck size={11} />}
            {quality.score}/100
          </span>
        )}
      </div>

      <a href={paper.url} target="_blank" rel="noopener noreferrer" className="mt-1 block">
        <h4 className="font-serif text-[15px] leading-snug text-fg transition-colors group-hover:text-accent">
          {paper.title}
        </h4>
      </a>

      <p className="mt-1 line-clamp-1 text-xs text-muted">
        {paper.authors.slice(0, 3).join(", ")}
        {paper.authors.length > 3 ? " et al." : ""} · {paper.venue ?? "—"}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {quality && <Badge className="border-accent/30 text-accent">{STUDY_LABEL[quality.studyType]}</Badge>}
        <Badge>{paper.year ?? "n.d."}</Badge>
        <Badge>
          <Quote size={10} /> {formatNumber(paper.citationCount)}
        </Badge>
        {paper.isOpenAccess && <Badge className="border-pro/30 text-pro">Open access</Badge>}
        {quality?.peerReviewed && <Badge>Peer-reviewed</Badge>}
      </div>

      {quality && quality.warnings.length > 0 && (
        <p className="mt-2.5 flex items-start gap-1 text-[11px] text-con/80">
          <AlertTriangle size={11} className="mt-0.5 shrink-0" />
          {quality.warnings.join(" · ")}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
        {paper.doi && <span className="font-mono">DOI: {paper.doi}</span>}
        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-muted transition-colors hover:text-accent"
        >
          Sumber <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}
