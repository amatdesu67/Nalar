// Struktur data klaim trending. MVP tanpa DB: seed di sini + tambahan manual
// (admin) disimpan di localStorage, lalu digabung. Penghitung "berapa kali
// dicari" juga disimpan di localStorage per klaim.

export interface TrendingClaim {
  id: string;
  claim: string;
  category: string; // mis. "Kesehatan", "Sains", "Sosial"
  note?: string; // konteks singkat kenapa ramai
  seeded?: boolean; // true bila dari daftar bawaan (tak bisa dihapus)
}

export interface TrendingItem extends TrendingClaim {
  count: number; // berapa kali diklik/dicari user
}

// Daftar bawaan — klaim/hoaks yang umum beredar di Indonesia.
export const SEED_CLAIMS: TrendingClaim[] = [
  { id: "seed-vit-c-covid", claim: "Vitamin C dosis tinggi bisa menyembuhkan COVID-19", category: "Kesehatan", note: "Klaim berulang sejak pandemi", seeded: true },
  { id: "seed-vaksin-autisme", claim: "Vaksin menyebabkan autisme pada anak", category: "Kesehatan", note: "Hoaks lama yang masih beredar", seeded: true },
  { id: "seed-air-alkali", claim: "Air alkali (pH tinggi) lebih sehat dan mencegah penyakit", category: "Kesehatan", seeded: true },
  { id: "seed-microwave-kanker", claim: "Memanaskan makanan dengan microwave menyebabkan kanker", category: "Sains", seeded: true },
  { id: "seed-gula-aren", claim: "Gula aren lebih aman untuk penderita diabetes daripada gula putih", category: "Kesehatan", seeded: true },
  { id: "seed-5g-corona", claim: "Sinyal 5G menyebarkan virus corona", category: "Teknologi", note: "Teori konspirasi viral", seeded: true },
  { id: "seed-detox-juice", claim: "Jus detoks membersihkan racun dari tubuh", category: "Kesehatan", seeded: true },
  { id: "seed-bumi-datar", claim: "Bumi itu datar, bukan bulat", category: "Sains", seeded: true },
];

export function normalizeClaim(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

// Gabung seed + custom, buang duplikat (berdasarkan teks ternormalisasi),
// lampirkan counter, lalu urutkan dari paling banyak dicari.
export function mergeTrending(
  seed: TrendingClaim[],
  custom: TrendingClaim[],
  counts: Record<string, number>
): TrendingItem[] {
  const byText = new Map<string, TrendingClaim>();
  for (const c of [...seed, ...custom]) {
    const key = normalizeClaim(c.claim);
    if (!byText.has(key)) byText.set(key, c);
  }
  return Array.from(byText.values())
    .map((c) => ({ ...c, count: counts[c.id] ?? 0 }))
    .sort((a, b) => b.count - a.count || a.claim.localeCompare(b.claim));
}

// Cari klaim trending yang cocok dengan teks pencarian (untuk menaikkan counter).
export function matchTrendingId(question: string, claims: TrendingClaim[]): string | null {
  const q = normalizeClaim(question);
  const hit = claims.find((c) => normalizeClaim(c.claim) === q);
  return hit ? hit.id : null;
}
