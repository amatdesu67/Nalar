// Rate limiter in-memory sederhana (per IP, fixed window).
// Catatan: di Vercel serverless, state ini per-instance dan bisa ter-reset
// saat instance baru dibuat. Cukup untuk meredam spam kasar & melindungi
// kuota AI/OpenAlex. Untuk akurasi lintas instance, gunakan Upstash Redis.

interface Hit {
  count: number;
  resetAt: number;
}

const store = new Map<string, Hit>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number; // detik sampai window berikutnya
}

export function rateLimit(key: string, limit = 8, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const hit = store.get(key);

  if (!hit || hit.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt, retryAfter: 0 };
  }

  hit.count += 1;
  const ok = hit.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - hit.count),
    resetAt: hit.resetAt,
    retryAfter: ok ? 0 : Math.ceil((hit.resetAt - now) / 1000),
  };
}

// Bersihkan entri kedaluwarsa sesekali agar Map tidak membengkak.
let lastSweep = Date.now();
export function sweep(): void {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k);
  }
}

// Ambil IP klien dari header proxy (Vercel mengisi x-forwarded-for).
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
