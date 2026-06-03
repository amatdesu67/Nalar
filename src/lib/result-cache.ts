import type { AnalysisResult } from "@/lib/types";

// Cache hasil analisa di localStorage agar hemat panggilan API & instan saat
// klaim yang sama dicari ulang. Strategi pemakaian: stale-while-revalidate —
// entri "fresh" dipakai langsung tanpa fetch; entri "stale" ditampilkan dulu
// lalu divalidasi ulang di latar belakang.

const KEY = "nalar:rcache";
const MAX_ENTRIES = 20;
const FRESH_MS = 1000 * 60 * 60 * 24; // 24 jam

interface CacheEntry {
  q: string; // kunci ternormalisasi
  at: number; // waktu simpan
  result: AnalysisResult;
}

export interface CacheHit {
  result: AnalysisResult;
  stale: boolean; // true bila lebih tua dari FRESH_MS
}

export function normalizeKey(q: string): string {
  return q.toLowerCase().replace(/\s+/g, " ").trim();
}

function readAll(store: Storage): CacheEntry[] {
  try {
    const raw = store.getItem(KEY);
    const data = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(data) ? (data as CacheEntry[]) : [];
  } catch {
    return [];
  }
}

export function readCache(q: string, now = Date.now(), store: Storage = localStorage): CacheHit | null {
  const key = normalizeKey(q);
  const entry = readAll(store).find((e) => e.q === key);
  if (!entry) return null;
  return { result: entry.result, stale: now - entry.at > FRESH_MS };
}

export function writeCache(q: string, result: AnalysisResult, now = Date.now(), store: Storage = localStorage): void {
  const key = normalizeKey(q);
  const entries = readAll(store).filter((e) => e.q !== key);
  entries.unshift({ q: key, at: now, result });
  try {
    store.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    /* kuota penuh / SSR — abaikan */
  }
}
