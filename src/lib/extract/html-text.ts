// Util ekstraksi teks dari HTML mentah (tanpa dependency) + guard URL.

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

export function htmlToText(html: string): string {
  return html
    // buang blok non-konten beserta isinya
    .replace(/<(script|style|noscript|template|svg)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    // jadikan pemisah baris pada elemen blok agar kalimat tak menempel
    .replace(/<\/(p|div|section|article|h[1-6]|li|br)[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // buang sisa tag
    .replace(/<[^>]+>/g, " ")
    // decode entitas umum + numerik
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;|&#39;/gi, (m) => ENTITIES[m.toLowerCase()] ?? " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .replace(/^\s+|\s+$/gm, "")
    .trim();
}

// Ambil <title> bila ada.
export function htmlTitle(html: string): string | null {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return m ? htmlToText(m[1]).slice(0, 200) || null : null;
}

// Anti-SSRF: hanya izinkan http(s) ke host publik. Tolak localhost, IP privat,
// dan TLD internal. Tidak menyelesaikan DNS — pertahanan lapis pertama.
export function isSafePublicUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal"))
    return false;
  if (host === "0.0.0.0" || host === "::1" || host === "[::1]") return false;
  // IPv4 privat / loopback / link-local
  if (/^127\./.test(host)) return false;
  if (/^10\./.test(host)) return false;
  if (/^192\.168\./.test(host)) return false;
  if (/^169\.254\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  return true;
}

// Parser aman untuk daftar klaim dari respons LLM (JSON array of string).
export function parseClaims(raw: string): string[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return [];
  try {
    const arr = JSON.parse(raw.slice(start, end + 1)) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => s.length >= 8 && s.length <= 300)
      .slice(0, 8);
  } catch {
    return [];
  }
}
