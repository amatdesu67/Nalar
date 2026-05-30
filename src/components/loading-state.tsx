import { Skeleton } from "@/components/ui/skeleton";

const STEPS = [
  "Mengubah pertanyaan jadi keyword akademik…",
  "Mencari paper relevan di OpenAlex…",
  "Menilai kualitas tiap sumber…",
  "Menganalisis bukti dengan AI…",
];

export function LoadingState({ step }: { step: number }) {
  return (
    <div className="animate-fade-up space-y-6">
      <div className="rounded-xl border border-border bg-surface/40 p-5">
        <ul className="space-y-2.5">
          {STEPS.map((s, i) => (
            <li
              key={i}
              className={`flex items-center gap-2.5 text-sm transition-opacity ${
                i <= step ? "text-fg" : "text-muted/40"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  i < step ? "bg-pro text-bg" : i === step ? "bg-accent text-bg" : "bg-border"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              {s}
            </li>
          ))}
        </ul>
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
