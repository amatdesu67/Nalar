"use client";
import { useState, useEffect, useCallback } from "react";

export interface HistoryItem {
  id: string;
  question: string;
  consensus: string;
  confidence: number;
  papers: number;
  at: number;
}

const KEY = "rizaai:history";

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: HistoryItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const add = useCallback(
    (item: Omit<HistoryItem, "id" | "at">) => {
      const entry: HistoryItem = { ...item, id: crypto.randomUUID(), at: Date.now() };
      persist([entry, ...items].slice(0, 30));
    },
    [items, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { items, add, clear };
}
