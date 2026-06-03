"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { AuthUser } from "@/lib/auth/use-auth";

export interface HistoryItem {
  id: string;
  question: string;
  consensus: string;
  confidence: number;
  papers: number;
  at: number;
}

const KEY = "nalar:history";
const LEGACY_KEY = "rizaai:history"; // sebelum rebranding — migrasi sekali jalan
const MAX = 30;
const TABLE = "searches";

interface Row {
  id: string;
  question: string;
  consensus: string | null;
  confidence: number | null;
  papers: number | null;
  at: number | null;
}

function rowToItem(r: Row): HistoryItem {
  return {
    id: r.id,
    question: r.question,
    consensus: r.consensus ?? "insufficient",
    confidence: r.confidence ?? 0,
    papers: r.papers ?? 0,
    at: r.at ?? 0,
  };
}

function itemToRow(i: HistoryItem, userId: string): Row & { user_id: string } {
  return {
    id: i.id,
    user_id: userId,
    question: i.question,
    consensus: i.consensus,
    confidence: i.confidence,
    papers: i.papers,
    at: i.at,
  };
}

// `user` opsional: bila ada (dan Supabase aktif), riwayat disinkronkan ke akun
// lintas device. Tanpa user, perilaku sama persis seperti sebelumnya (localStorage).
export function useHistory(user?: AuthUser | null) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const migratedFor = useRef<string | null>(null);

  // Muat dari localStorage saat mount.
  useEffect(() => {
    try {
      let raw = localStorage.getItem(KEY);
      if (!raw) {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          localStorage.setItem(KEY, legacy);
          localStorage.removeItem(LEGACY_KEY);
          raw = legacy;
        }
      }
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const persistLocal = useCallback((next: HistoryItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  // Saat user login: migrasi riwayat lokal ke akun, lalu pakai remote sbg sumber.
  useEffect(() => {
    const sb = getSupabase();
    if (!user || !sb) return;
    if (migratedFor.current === user.id) return;
    migratedFor.current = user.id;

    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        const local = JSON.parse(localStorage.getItem(KEY) || "[]") as HistoryItem[];
        if (Array.isArray(local) && local.length > 0) {
          await sb.from(TABLE).upsert(local.map((i) => itemToRow(i, user.id)), { onConflict: "id" });
        }
        const { data } = await sb
          .from(TABLE)
          .select("id, question, consensus, confidence, papers, at")
          .order("at", { ascending: false })
          .limit(MAX);
        if (!cancelled && data) {
          const merged = (data as Row[]).map(rowToItem);
          persistLocal(merged);
        }
      } catch {
        /* offline / RLS — tetap pakai lokal */
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, persistLocal]);

  // Reset penanda migrasi saat logout agar login berikutnya menyinkron ulang.
  useEffect(() => {
    if (!user) migratedFor.current = null;
  }, [user]);

  const add = useCallback(
    (item: Omit<HistoryItem, "id" | "at">) => {
      const entry: HistoryItem = { ...item, id: crypto.randomUUID(), at: Date.now() };
      persistLocal([entry, ...items].slice(0, MAX));
      const sb = getSupabase();
      if (user && sb) {
        sb.from(TABLE).insert(itemToRow(entry, user.id)).then(undefined, () => {});
      }
    },
    [items, persistLocal, user]
  );

  const remove = useCallback(
    (id: string) => {
      persistLocal(items.filter((i) => i.id !== id));
      const sb = getSupabase();
      if (user && sb) {
        sb.from(TABLE).delete().eq("id", id).then(undefined, () => {});
      }
    },
    [items, persistLocal, user]
  );

  const clear = useCallback(() => {
    persistLocal([]);
    const sb = getSupabase();
    if (user && sb) {
      sb.from(TABLE).delete().eq("user_id", user.id).then(undefined, () => {});
    }
  }, [persistLocal, user]);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nalar-riwayat-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items]);

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
      persistLocal(merged);

      const sb = getSupabase();
      if (user && sb) {
        sb.from(TABLE).upsert(merged.map((i) => itemToRow(i, user.id)), { onConflict: "id" }).then(undefined, () => {});
      }
    },
    [items, persistLocal, user]
  );

  return { items, syncing, add, remove, clear, exportData, importData };
}
