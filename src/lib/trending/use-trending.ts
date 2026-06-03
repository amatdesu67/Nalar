"use client";
import { useCallback, useEffect, useState } from "react";
import {
  SEED_CLAIMS,
  mergeTrending,
  matchTrendingId,
  type TrendingClaim,
  type TrendingItem,
} from "@/lib/trending/data";

const CUSTOM_KEY = "nalar:trending:custom";
const COUNT_KEY = "nalar:trending:counts";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function useTrending() {
  const [custom, setCustom] = useState<TrendingClaim[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCustom(read<TrendingClaim[]>(CUSTOM_KEY, []));
    setCounts(read<Record<string, number>>(COUNT_KEY, {}));
    setReady(true);
  }, []);

  const items: TrendingItem[] = mergeTrending(SEED_CLAIMS, custom, counts);

  const addClaim = useCallback((claim: string, category: string, note?: string) => {
    const entry: TrendingClaim = {
      id: `c-${Date.now().toString(36)}`,
      claim: claim.trim(),
      category: category.trim() || "Umum",
      note: note?.trim() || undefined,
    };
    setCustom((cur) => {
      const next = [entry, ...cur];
      write(CUSTOM_KEY, next);
      return next;
    });
  }, []);

  const removeClaim = useCallback((id: string) => {
    setCustom((cur) => {
      const next = cur.filter((c) => c.id !== id);
      write(CUSTOM_KEY, next);
      return next;
    });
  }, []);

  // Naikkan counter bila teks pencarian cocok dengan salah satu klaim trending.
  const bumpIfTrending = useCallback(
    (question: string) => {
      const id = matchTrendingId(question, [...SEED_CLAIMS, ...custom]);
      if (!id) return;
      setCounts((cur) => {
        const next = { ...cur, [id]: (cur[id] ?? 0) + 1 };
        write(COUNT_KEY, next);
        return next;
      });
    },
    [custom]
  );

  return { items, ready, addClaim, removeClaim, bumpIfTrending };
}
