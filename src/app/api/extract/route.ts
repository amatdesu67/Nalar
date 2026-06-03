import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ai/provider";
import { EXTRACT_SYSTEM, buildExtractPrompt } from "@/lib/ai/extract-prompt";
import { htmlToText, htmlTitle, isSafePublicUrl, parseClaims } from "@/lib/extract/html-text";
import { rateLimit, sweep, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const FETCH_TIMEOUT = 10_000;
const MAX_TEXT = 6000; // potong teks agar prompt tetap hemat

async function fetchPage(url: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "NalarBot/1.0 (+https://nalar.vercel.app)", Accept: "text/html" },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("text/html") && !type.includes("text/plain")) throw new Error("bukan halaman teks");
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: NextRequest) {
  sweep();
  const ip = clientIp(req.headers);
  const rl = rateLimit(`extract:${ip}`, 6, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Terlalu banyak permintaan. Coba lagi dalam ${rl.retryAfter} detik.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { url?: unknown };
  try {
    body = (await req.json()) as { url?: unknown };
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!isSafePublicUrl(url)) {
    return NextResponse.json({ error: "URL tidak valid. Tempel tautan artikel/berita (http/https)." }, { status: 400 });
  }

  let html: string;
  try {
    html = await fetchPage(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/abort/i.test(msg)) return NextResponse.json({ error: "Halaman terlalu lama merespons. Coba URL lain." }, { status: 504 });
    return NextResponse.json({ error: "Gagal mengambil isi halaman. Pastikan tautannya bisa diakses publik." }, { status: 502 });
  }

  const title = htmlTitle(html);
  const text = htmlToText(html).slice(0, MAX_TEXT);
  if (text.length < 120) {
    return NextResponse.json({ error: "Isi halaman terlalu sedikit untuk diekstrak." }, { status: 422 });
  }

  try {
    const raw = await chat({
      system: EXTRACT_SYSTEM,
      user: buildExtractPrompt(text, title),
      maxTokens: 500,
    });
    const claims = parseClaims(raw);
    if (claims.length === 0) {
      return NextResponse.json({ error: "Tidak menemukan klaim ilmiah yang bisa diuji di halaman ini." }, { status: 422 });
    }
    return NextResponse.json({ title, claims });
  } catch {
    return NextResponse.json({ error: "Gagal mengekstrak klaim. Coba lagi." }, { status: 500 });
  }
}
