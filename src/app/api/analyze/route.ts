import { NextRequest, NextResponse } from "next/server";
import { analyze } from "@/lib/ai/analyze";
import { rateLimit, sweep, clientIp } from "@/lib/rate-limit";
import { sanitizeQuestion } from "@/lib/sanitize";

export const runtime = "nodejs";
export const maxDuration = 60;

// Petakan error internal jadi pesan yang membantu pengguna (tanpa bocorkan detail).
function friendlyError(msg: string): { status: number; text: string } {
  const m = msg.toLowerCase();
  if (m.includes("tidak ada paper")) return { status: 404, text: msg };
  if (m.includes("openalex"))
    return { status: 502, text: "Gagal mengambil paper dari database akademik (OpenAlex). Coba lagi sebentar lagi." };
  if (m.includes("invalid api key") || m.includes("401") || m.includes("belum diset"))
    return { status: 500, text: "Konfigurasi layanan AI bermasalah. Hubungi pengelola situs." };
  if (m.includes("429") || m.includes("rate limit") || m.includes("quota") || m.includes("limit"))
    return { status: 429, text: "Layanan AI sedang sibuk (kuota tercapai). Coba lagi dalam beberapa saat." };
  if (m.includes("json"))
    return { status: 502, text: "Respons AI tidak bisa dibaca. Coba ulangi atau ubah sedikit pertanyaannya." };
  return { status: 500, text: "Terjadi kesalahan saat menganalisis. Coba lagi." };
}

export async function POST(req: NextRequest) {
  // 1) Rate limit per IP — cegah spam yang membakar kuota AI/OpenAlex.
  sweep();
  const ip = clientIp(req.headers);
  const rl = rateLimit(`analyze:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Terlalu banyak permintaan. Coba lagi dalam ${rl.retryAfter} detik.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  // 2) Parse + 3) sanitasi input.
  let body: { question?: unknown };
  try {
    body = (await req.json()) as { question?: unknown };
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const clean = sanitizeQuestion(body.question);
  if (!clean.ok) {
    return NextResponse.json({ error: clean.error }, { status: 400 });
  }

  // 4) Jalankan analisis.
  try {
    const result = await analyze(clean.value);
    return NextResponse.json(result, {
      headers: { "X-RateLimit-Remaining": String(rl.remaining) },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kesalahan tak terduga.";
    const f = friendlyError(msg);
    return NextResponse.json({ error: f.text }, { status: f.status });
  }
}
