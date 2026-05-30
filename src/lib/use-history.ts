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
const MAX = 30;

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
      persist([entry, ...items].slice(0, MAX));
    },
    [items, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  // Backup: unduh seluruh riwayat sebagai file JSON.
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rizaai-riwayat-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items]);

  // Restore: gabungkan riwayat dari file, dedupe berdasarkan id, ambil 30 terbaru.
  const importData = useCallback(
    async (file: File) => {
      const text = await file.text();
      const incoming = JSON.parse(text) as unknown;
      if (!Array.isArray(incoming)) throw new Error("Format file tidak valid.");

      const map = new Map<string, HistoryItem>();
      for (const raw of [...(incoming as HistoryItem[]), ...items]) {
        if (raw && typeof raw.id === "string" && typeof raw.question === "string") {
          map.set(raw.id, { ...raw, at: typeof raw.at === "number" ? raw.at : 0 });
        }
      }
      const merged = [...map.values()].sort((a, b) => b.at - a.at).slice(0, MAX);
      persist(merged);
    },
    [items, persist]
  );

  return { items, add, clear, exportData, importData };
}
