"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase, isSupabaseEnabled } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
}

export function useAuth() {
  const enabled = isSupabaseEnabled();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;

    const map = (u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null): AuthUser | null =>
      u
        ? {
            id: u.id,
            email: u.email ?? null,
            name: (u.user_metadata?.full_name as string) ?? (u.user_metadata?.name as string) ?? null,
            avatar: (u.user_metadata?.avatar_url as string) ?? null,
          }
        : null;

    sb.auth.getUser().then(({ data }) => {
      setUser(map(data.user));
      setLoading(false);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(map(session?.user ?? null));
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInGoogle = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }, []);

  // Magic link via email (OTP). Supabase mengirim tautan login ke email.
  const signInEmail = useCallback(async (email: string) => {
    const sb = getSupabase();
    if (!sb) throw new Error("Akun nonaktif.");
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
    setUser(null);
  }, []);

  return { enabled, user, loading, signInGoogle, signInEmail, signOut };
}
