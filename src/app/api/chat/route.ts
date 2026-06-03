import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ai/provider";
import { CHAT_SYSTEM, buildChatUserPrompt, type ChatContext, type ChatMessage } from "@/lib/ai/chat-prompt";
import { rateLimit, sweep, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_MSG_LEN = 500;

interface ChatBody {
  question?: unknown;
  summary?: unknown;
  papers?: unknown;
  messages?: unknown;
}

function isMessage(m: unknown): m is ChatMessage {
  return (
    typeof m === "object" &&
    m !== null &&
    ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
    typeof (m as ChatMessage).content === "string"
  );
}

function sanitizeContext(body: ChatBody): { ctx: ChatContext; messages: ChatMessage[] } | null {
  if (typeof body.question !== "string") return null;
  if (!Array.isArray(body.messages) || body.messages.length === 0) return null;
  const messages = body.messages.filter(isMessage).map((m) => ({
    role: m.role,
    content: m.content.replace(/```+/g, " ").slice(0, MAX_MSG_LEN).trim(),
  }));
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") return null;
  if (!messages[messages.length - 1].content) return null;

  const rawPapers = Array.isArray(body.papers) ? body.papers : [];
  const papers: ChatContext["papers"] = rawPapers
    .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
    .map((p) => ({
      title: typeof p.title === "string" ? p.title : "",
      year: typeof p.year === "number" ? p.year : null,
      authors: Array.isArray(p.authors) ? p.authors.filter((a): a is string => typeof a === "string") : [],
      abstract: typeof p.abstract === "string" ? p.abstract : null,
    }));

  return {
    ctx: {
      question: body.question.slice(0, 300),
      summary: typeof body.summary === "string" ? body.summary.slice(0, 1500) : "",
      papers,
    },
    messages,
  };
}

export async function POST(req: NextRequest) {
  sweep();
  const ip = clientIp(req.headers);
  const rl = rateLimit(`chat:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Terlalu banyak pertanyaan. Coba lagi dalam ${rl.retryAfter} detik.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const parsed = sanitizeContext(body);
  if (!parsed) {
    return NextResponse.json({ error: "Pertanyaan lanjutan tidak valid." }, { status: 400 });
  }

  try {
    const answer = await chat({
      system: CHAT_SYSTEM,
      user: buildChatUserPrompt(parsed.ctx, parsed.messages),
      maxTokens: 600,
    });
    return NextResponse.json({ answer: answer.trim() });
  } catch (e) {
    const msg = (e instanceof Error ? e.message : "").toLowerCase();
    if (msg.includes("429") || msg.includes("rate limit") || msg.includes("quota")) {
      return NextResponse.json(
        { error: "Layanan AI sedang sibuk. Coba lagi sebentar lagi." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Gagal menjawab. Coba lagi." }, { status: 500 });
  }
}
