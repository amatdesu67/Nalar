import type { Paper } from "@/lib/types";

const BASE = "https://api.openalex.org/works";

// OpenAlex menyimpan abstrak sebagai inverted index. Rekonstruksi jadi teks.
function reconstructAbstract(inv: Record<string, number[]> | null): string | null {
  if (!inv) return null;
  const slots: string[] = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const pos of positions) slots[pos] = word;
  }
  const text = slots.filter(Boolean).join(" ").trim();
  return text.length > 0 ? text : null;
}

interface OAWork {
  id: string;
  display_name: string | null;
  publication_year: number | null;
  cited_by_count: number;
  doi: string | null;
  type: string | null;
  abstract_inverted_index: Record<string, number[]> | null;
  open_access?: { is_oa?: boolean };
  primary_location?: { landing_page_url?: string | null; source?: { display_name?: string } | null } | null;
  authorships?: { author?: { display_name?: string } }[];
}

/**
 * Mencari paper paling relevan di OpenAlex.
 * Strategi: relevansi penuh-teks + bobot sitasi, fokus 20 tahun terakhir.
 */
export async function searchPapers(keywords: string, limit = 18): Promise<Paper[]> {
  const mailto = process.env.OPENALEX_MAILTO;
  const params = new URLSearchParams({
    search: keywords,
    per_page: String(limit),
    sort: "relevance_score:desc",
    filter: "from_publication_date:2005-01-01",
    select:
      "id,display_name,publication_year,cited_by_count,doi,type,abstract_inverted_index,open_access,primary_location,authorships",
  });
  if (mailto) params.set("mailto", mailto);

  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { "User-Agent": `RizaAi${mailto ? ` (${mailto})` : ""}` },
    next: { revalidate: 60 * 60 }, // cache 1 jam di sisi Next
  });

  if (!res.ok) throw new Error(`OpenAlex error ${res.status}`);
  const data = (await res.json()) as { results: OAWork[] };

  return (data.results ?? []).map((w): Paper => {
    const doi = w.doi ? w.doi.replace("https://doi.org/", "") : null;
    return {
      id: w.id,
      title: w.display_name ?? "Untitled",
      abstract: reconstructAbstract(w.abstract_inverted_index),
      authors: (w.authorships ?? [])
        .map((a) => a.author?.display_name)
        .filter((n): n is string => !!n)
        .slice(0, 6),
      year: w.publication_year,
      venue: w.primary_location?.source?.display_name ?? null,
      citationCount: w.cited_by_count ?? 0,
      doi,
      url: w.primary_location?.landing_page_url ?? (doi ? `https://doi.org/${doi}` : w.id),
      isOpenAccess: !!w.open_access?.is_oa,
      type: w.type ?? null,
    };
  });
}
