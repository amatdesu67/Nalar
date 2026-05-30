import { NextRequest, NextResponse } from "next/server";
import { analyze } from "@/lib/ai/analyze";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { question } = (await req.json()) as { question?: string };
    if (!question || question.trim().length < 5) {
      return NextResponse.json({ error: "Pertanyaan terlalu pendek." }, { status: 400 });
    }
    const result = await analyze(question.trim());
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Terjadi kesalahan tak terduga.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
