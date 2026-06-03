import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ai/provider";
import { TRANSLATE_SYSTEM, translatePrompt } from "@/lib/ai/prompts";
import { rateLimit, sweep, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_LEN = 4000;

export async function POST(req: NextRequest) {
  // Terjemahan lebih sering & lebih murah dari analisa, beri kuota lebih longgar.
  sweep();
  const ip = clientIp(req.headers);
  const rl = rateLimit(`translate:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Terlalu banyak permintaan terjemahan. Coba lagi dalam ${rl.retryAfter} detik.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { text?: unknown };
  try {
    body = (await req.json()) as { text?: unknown };
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Teks kosong." }, { status: 400 });
  }
  // Potong daripada menolak — abstrak panjang tetap bisa diterjemahkan sebagian.
  const clipped = text.slice(0, MAX_LEN);

  try {
    const raw = await chat({
      system: TRANSLATE_SYSTEM,
      user: translatePrompt(clipped),
      maxTokens: 1500,
    });
    const translation = raw.trim();
    if (!translation) {
      return NextResponse.json({ error: "Terjemahan kosong. Coba lagi." }, { status: 502 });
    }
    return NextResponse.json(
      { translation },
      { headers: { "X-RateLimit-Remaining": String(rl.remaining) } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message.toLowerCase() : "";
    if (msg.includes("429") || msg.includes("rate limit") || msg.includes("quota")) {
      return NextResponse.json(
        { error: "Layanan AI sedang sibuk. Coba lagi sebentar lagi." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Gagal menerjemahkan. Coba lagi." }, { status: 500 });
  }
}
