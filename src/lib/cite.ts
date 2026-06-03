import type { Paper } from "@/lib/types";

// Catatan: OpenAlex memberi nama penulis sebagai "display name" (mis. "John Doe"),
// bukan komponen terstruktur. Pemecahan nama depan/belakang di sini bersifat
// best-effort (token terakhir dianggap nama keluarga).

interface NameParts {
  last: string;
  first: string; // bisa kosong
}

function splitName(display: string): NameParts {
  const parts = display.trim().split(/\s+/);
  if (parts.length === 1) return { last: parts[0], first: "" };
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(" ");
  return { last, first };
}

function initials(first: string): string {
  return first
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => `${p[0].toUpperCase()}.`)
    .join(" ");
}

// Kunci BibTeX: namakeluarga + tahun (mis. doe2020), aman untuk LaTeX.
export function citationKey(p: Paper): string {
  const first = p.authors[0] ? splitName(p.authors[0]).last : "anon";
  const slug = first.toLowerCase().replace(/[^a-z]/g, "") || "anon";
  return `${slug}${p.year ?? "nd"}`;
}

export function toBibTeX(p: Paper): string {
  const fields: [string, string | null][] = [
    ["title", p.title],
    ["author", p.authors.length ? p.authors.join(" and ") : null],
    ["year", p.year ? String(p.year) : null],
    ["journal", p.venue],
    ["doi", p.doi],
    ["url", p.url],
  ];
  const body = fields
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${k} = {${v}}`)
    .join(",\n");
  return `@article{${citationKey(p)},\n${body}\n}`;
}

// APA 7: Last, F. M., & Last, F. (Year). Title. Venue. https://doi.org/DOI
export function toAPA(p: Paper): string {
  const names = p.authors.map((a) => {
    const { last, first } = splitName(a);
    const init = initials(first);
    return init ? `${last}, ${init}` : last;
  });
  let authorStr = "";
  if (names.length === 1) authorStr = names[0];
  else if (names.length > 1)
    authorStr = `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;

  const year = p.year ? `(${p.year}).` : "(n.d.).";
  const title = p.title.endsWith(".") ? p.title : `${p.title}.`;
  const venue = p.venue ? ` ${p.venue}.` : "";
  const link = p.doi ? ` https://doi.org/${p.doi}` : ` ${p.url}`;
  return `${authorStr ? authorStr + " " : ""}${year} ${title}${venue}${link}`.trim();
}

// MLA 9: Last, First, et al. "Title." Venue, Year, doi:DOI.
export function toMLA(p: Paper): string {
  let authorStr = "";
  if (p.authors.length === 1) {
    const { last, first } = splitName(p.authors[0]);
    authorStr = first ? `${last}, ${first}` : last;
  } else if (p.authors.length > 1) {
    const { last, first } = splitName(p.authors[0]);
    authorStr = `${first ? `${last}, ${first}` : last}, et al`;
  }

  const title = `"${p.title.endsWith(".") ? p.title : `${p.title}.`}"`;
  const venueYear = [p.venue, p.year ? String(p.year) : null].filter(Boolean).join(", ");
  const link = p.doi ? `doi:${p.doi}.` : `${p.url}.`;
  return [authorStr ? `${authorStr}.` : "", title, venueYear ? `${venueYear},` : "", link]
    .filter(Boolean)
    .join(" ");
}

export type CiteFormat = "bibtex" | "apa" | "mla";

export const CITE_LABEL: Record<CiteFormat, string> = {
  bibtex: "BibTeX",
  apa: "APA",
  mla: "MLA",
};

export function formatCitation(p: Paper, fmt: CiteFormat): string {
  if (fmt === "bibtex") return toBibTeX(p);
  if (fmt === "apa") return toAPA(p);
  return toMLA(p);
}

// Gabungan semua paper untuk berkas .bib (export massal).
export function toBibTeXAll(papers: Paper[]): string {
  return papers.map(toBibTeX).join("\n\n");
}
