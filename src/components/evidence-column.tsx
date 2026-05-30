import { Check, X } from "lucide-react";
import type { EvidenceItem, Paper } from "@/lib/types";

const STRENGTH_LABEL = { strong: "kuat", moderate: "sedang", weak: "lemah" } as const;

const STYLES = {
  pro: { wrap: "bg-pro/15 text-pro", chip: "text-pro bg-pro/10", icon: Check },
  con: { wrap: "bg-con/15 text-con", chip: "text-con bg-con/10", icon: X },
} as const;

export function EvidenceColumn({
  title,
  side,
  items,
  papers,
}: {
  title: string;
  side: "pro" | "con";
  items: EvidenceItem[];
  papers: Paper[];
}) {
  const s = STYLES[side];
  const Icon = s.icon;
  const refIndex = (id: string) => papers.findIndex((p) => p.id === id) + 1;

  return (
    <div className="rounded-xl border border-border bg-surface/40 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${s.wrap}`}>
          <Icon size={14} />
        </span>
        <h3 className="font-serif text-base text-fg">{title}</h3>
        <span className="ml-auto font-mono text-xs text-muted">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">Tidak ada poin yang menonjol dari paper.</p>
      ) : (
        <ul className="space-y-3.5">
          {items.map((e, i) => (
            <li key={i} className="text-sm leading-relaxed text-fg/90">
              <p>{e.claim}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${s.chip}`}>
                  bukti {STRENGTH_LABEL[e.strength]}
                </span>
                {e.paperIds.map((id) => {
                  const n = refIndex(id);
                  return n > 0 ? (
                    <span key={id} className="font-mono text-[10px] text-muted">
                      [{n}]
                    </span>
                  ) : null;
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
