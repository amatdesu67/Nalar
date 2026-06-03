import { NextRequest, NextResponse, after } from "next/server";
import { analyze } from "@/lib/ai/analyze";
import { sanitizeQuestion } from "@/lib/sanitize";
import { rateLimit } from "@/lib/rate-limit";
import { sendText, whatsappConfigured } from "@/lib/whatsapp/client";
import { formatAnalysis } from "@/lib/whatsapp/format";

export const runtime = "nodejs";
export const maxDuration = 60;

// Tipe payload webhook WhatsApp Cloud API (bagian yang kita pakai saja).
interface WAMessage {
  from: string;
  id: string;
  type: string;
  text?: { body: string };
}
interface WAWebhook {
  entry?: {
    changes?: { value?: { messages?: WAMessage[] } }[];
  }[];
}

// Cegah pemrosesan ganda saat Meta mengirim ulang webhook (at-least-once).
const seen = new Set<string>();
function alreadyHandled(id: string): boolean {
  if (seen.has(id)) return true;
  seen.add(id);
  if (seen.size > 1000) seen.clear(); // batasi memori
  return false;
}

// --- GET: verifikasi webhook saat setup di Meta ---
export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const mode = p.get("hub.mode");
  const token = p.get("hub.verify_token");
  const challenge = p.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// Proses satu pesan: analisa lalu kirim balasan. Dijalankan via after()
// supaya webhook bisa balas 200 cepat (WhatsApp retry bila lambat).
async function handleMessage(from: string, text: string) {
  try {
    const clean = sanitizeQuestion(text);
    if (!clean.ok) {
      await sendText(from, `⚠️ ${clean.error ?? "Pertanyaan tidak valid."}`);
      return;
    }
    // Lindungi kuota: maksimal beberapa analisa per pengirim per menit.
    const rl = rateLimit(`wa:${from}`, 5, 60_000);
    if (!rl.ok) {
      await sendText(from, `⏳ Terlalu banyak permintaan. Coba lagi dalam ${rl.retryAfter} detik.`);
      return;
    }

    await sendText(from, "🔬 Sebentar ya, sedang mencari & menganalisis bukti ilmiah…");
    const result = await analyze(clean.value);
    await sendText(from, formatAnalysis(result));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    const friendly = msg.toLowerCase().includes("tidak ada paper")
      ? "Tidak menemukan paper relevan. Coba klaim yang lebih spesifik."
      : "Maaf, terjadi kendala saat menganalisis. Coba lagi sebentar lagi.";
    try {
      await sendText(from, `⚠️ ${friendly}`);
    } catch {
      // Kirim balasan pun gagal — sudah tidak ada yang bisa dilakukan.
    }
  }
}

// --- POST: pesan masuk ---
export async function POST(req: NextRequest) {
  // Selalu balas 200 cepat agar Meta tidak retry; pemrosesan dilakukan setelahnya.
  if (!whatsappConfigured()) {
    // Tetap 200 agar webhook tidak dianggap gagal, tapi tidak proses apa pun.
    return NextResponse.json({ ok: true, note: "WhatsApp belum dikonfigurasi" });
  }

  let body: WAWebhook;
  try {
    body = (await req.json()) as WAWebhook;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  // Abaikan status delivery/read dan tipe non-teks.
  if (msg && msg.type === "text" && msg.text?.body && !alreadyHandled(msg.id)) {
    const from = msg.from;
    const text = msg.text.body;
    after(() => handleMessage(from, text));
  }

  return NextResponse.json({ ok: true });
}
