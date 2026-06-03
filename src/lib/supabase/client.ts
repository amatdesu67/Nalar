"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client Supabase sisi-browser. Bila env tidak diset, fitur akun nonaktif
// dan app tetap berjalan dengan riwayat localStorage (degradasi mulus).
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cached: SupabaseClient | null = null;

export function isSupabaseEnabled(): boolean {
  return Boolean(URL && ANON);
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseEnabled()) return null;
  if (!cached) {
    cached = createClient(URL as string, ANON as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return cached;
}
