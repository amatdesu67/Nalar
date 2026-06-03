import { NextRequest, NextResponse } from "next/server";
import { analyze } from "@/lib/ai/analyze";
import { sanitizeQuestion } from "@/lib/sanitize";
import { rateLimit, sweep } from "@/lib/rate-limit";
import { parseApiKeys, authenticate } from "@/lib/api-keys";

export const runtime = "nodejs";
export const maxDuration = 60;

// Bentuk respons publik (lebih ringkas dari AnalysisResult internal).
function toPublic(r: Awaited<ReturnType<typeof analyze>>) {
  return {
    claim: r.question,
    consensus: r.consensus,
    confidence: r.confidence,
    summary: r.summary,
    papersAnalyzed: r.papersAnalyzed,
    papers: r.papers.map((p) => ({
      title: p.title,
      authors: p.authors,
      year: p.year,
      doi: p.doi,
      url: p.url,
      venue: p.venue,
      citationCount: p.citationCount,
      isOpenAccess: p.isOpenAccess,
      isRetracted: p.isRetracted,
    })),
  };
}

function err(status: number, error: string, headers?: Record<string, string>) {
  return NextResponse.json({ error }, { status, headers });
}

export async function POST(req: NextRequest) {
  // 1) Autentikasi API key.
  const keys = parseApiKeys(process.env.NALAR_API_KEYS);
  const auth = authenticate(req.headers, keys);
  if (!auth.ok) return err(auth.status ?? 401, auth.error ?? "Tidak diizinkan.");

  // 2) Rate limit per key (bukan per IP) — kuota adil tiap konsumen.
  sweep();
  const rl = rateLimit(`v1:${auth.key}`, 30, 60_000);
  if (!rl.ok) {
    return err(429, `Rate limit terlampaui. Coba lagi dalam ${rl.retryAfter} detik.`, {
      "Retry-After": String(rl.retryAfter),
      "X-RateLimit-Limit": "30",
    });
  }

  // 3) Parse + sanitasi. Terima { claim } (utama) atau { question }.
  let body: { claim?: unknown; question?: unknown };
  try {
    body = (await req.json()) as { claim?: unknown; question?: unknown };
  } catch {
    return err(400, "Body harus JSON: { \"claim\": \"...\" }");
  }
  const clean = sanitizeQuestion(body.claim ?? body.question);
  if (!clean.ok) return err(400, clean.error ?? "Klaim tidak valid.");

  // 4) Analisa.
  try {
    const result = await analyze(clean.value);
    return NextResponse.json(toPublic(result), {
      headers: { "X-RateLimit-Remaining": String(rl.remaining) },
    });
  } catch (e) {
    const msg = (e instanceof Error ? e.message : "").toLowerCase();
    if (msg.includes("tidak ada paper")) return err(404, "Tidak ada paper relevan untuk klaim ini.");
    if (msg.includes("429") || msg.includes("rate limit") || msg.includes("quota"))
      return err(503, "Layanan AI sedang sibuk. Coba lagi sebentar lagi.");
    return err(500, "Gagal menganalisis klaim.");
  }
}

export function GET() {
  return err(405, "Gunakan POST dengan body { claim }. Lihat /docs.");
}
