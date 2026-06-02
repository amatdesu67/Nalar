"use client";
import { useCallback, useState } from "react";

// Cache terjemahan tingkat-modul: bertahan lintas mount/unmount komponen dan
// dipakai bersama oleh toggle global, sehingga teks yang sama tidak
// diterjemahkan ulang (hemat panggilan AI).
const cache = new Map<string, string>();

export function useTranslate(key: string, text: string | null) {
  const [translation, setTranslation] = useState<string | null>(() => cache.get(key) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async () => {
    if (!text) return;
    const hit = cache.get(key);
    if (hit) {
      setTranslation(hit);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { translation?: string; error?: string };
      if (!res.ok || !data.translation) {
        throw new Error(data.error || "Gagal menerjemahkan");
      }
      cache.set(key, data.translation);
      setTranslation(data.translation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menerjemahkan");
    } finally {
      setLoading(false);
    }
  }, [key, text]);

  return { translation, loading, error, translate };
}
