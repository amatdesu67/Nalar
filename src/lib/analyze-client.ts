import type { AnalysisResult, ApiError } from "@/lib/types";

// Panggil endpoint analyze dari sisi klien + normalisasi error jadi pesan jelas.
export async function analyzeClaim(question: string): Promise<AnalysisResult> {
  let res: Response;
  try {
    res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
  } catch {
    throw new Error("Tidak bisa terhubung ke server. Cek koneksi internet kamu.");
  }
  const data = (await res.json()) as AnalysisResult | ApiError;
  if (!res.ok || "error" in data) {
    throw new Error(("error" in data && data.error) || "Gagal menganalisis.");
  }
  return data;
}
