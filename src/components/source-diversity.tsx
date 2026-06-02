import { Users, Building2, Info } from "lucide-react";
import type { Paper } from "@/lib/types";
import { analyzeDiversity } from "@/lib/diversity";

export function SourceDiversity({ papers }: { papers: Paper[] }) {
  const d = analyzeDiversity(papers);
  // Tidak tampilkan apa pun bila tak ada data sumber sama sekali.
  if (d.uniqueAuthors === 0 && d.uniqueInstitutions === 0) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-surface/20 p-5">
      <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
        <Users size={13} className="text-accent" /> Diversitas Sumber
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="border-r border-border/40 pr-2">
          <p className="font-serif text-2xl font-bold text-fg">{d.uniqueAuthors}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
            <Users size={11} /> penulis unik
          </p>
        </div>
        <div className="pl-2">
          <p className="font-serif text-2xl font-bold text-fg">{d.uniqueInstitutions}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
            <Building2 size={11} /> institusi unik
          </p>
        </div>
      </div>

      {d.note && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
          <Info size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-[12.5px] leading-relaxed text-amber-200/85">{d.note}</p>
        </div>
      )}
    </div>
  );
}
