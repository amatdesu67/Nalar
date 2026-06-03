// Autentikasi API publik sederhana berbasis key statis.
// Set key lewat env NALAR_API_KEYS (dipisah koma), mis:
//   NALAR_API_KEYS="key_live_abc,key_live_def"
// MVP: bila env kosong, API publik dianggap nonaktif (semua ditolak).

export function parseApiKeys(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
  );
}

// Ambil API key dari header: "x-api-key: <key>" atau "Authorization: Bearer <key>".
export function extractApiKey(headers: Headers): string | null {
  const direct = headers.get("x-api-key");
  if (direct && direct.trim()) return direct.trim();
  const auth = headers.get("authorization");
  if (auth) {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (m) return m[1].trim();
  }
  return null;
}

export interface AuthResult {
  ok: boolean;
  key?: string;
  status?: number;
  error?: string;
}

export function authenticate(headers: Headers, keys: Set<string>): AuthResult {
  if (keys.size === 0) {
    return { ok: false, status: 503, error: "API publik belum diaktifkan oleh pengelola." };
  }
  const key = extractApiKey(headers);
  if (!key) {
    return { ok: false, status: 401, error: "API key wajib. Sertakan header 'x-api-key' atau 'Authorization: Bearer <key>'." };
  }
  if (!keys.has(key)) {
    return { ok: false, status: 403, error: "API key tidak valid." };
  }
  return { ok: true, key };
}
