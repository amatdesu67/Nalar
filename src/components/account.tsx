"use client";
import { useState } from "react";
import { LogIn, LogOut, Mail, Check, Loader2, UserRound } from "lucide-react";
import type { useAuth } from "@/lib/auth/use-auth";

type Auth = ReturnType<typeof useAuth>;

export function AccountWidget({ auth }: { auth: Auth }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fitur akun nonaktif (env Supabase belum diset) → jangan tampilkan apa pun.
  if (!auth.enabled) return null;

  if (auth.loading) {
    return (
      <div className="glass-panel rounded-2xl p-4 text-[12px] text-muted">
        <Loader2 size={13} className="mr-2 inline animate-spin" /> Memuat akun…
      </div>
    );
  }

  // Sudah login.
  if (auth.user) {
    const { user } = auth;
    return (
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-3">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="" className="h-9 w-9 rounded-full border border-border/60" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 border border-accent/25">
              <UserRound size={17} className="text-accent" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-fg">{user.name ?? "Akun Nalar"}</p>
            <p className="truncate text-[11px] text-muted">{user.email}</p>
          </div>
          <button
            onClick={auth.signOut}
            className="shrink-0 text-muted/70 transition-colors hover:text-con"
            title="Keluar"
            aria-label="Keluar"
          >
            <LogOut size={16} />
          </button>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[10px] text-pro/80">
          <Check size={11} /> Riwayat tersinkron lintas perangkat
        </p>
      </div>
    );
  }

  // Belum login.
  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await auth.signInEmail(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim tautan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-4">
      <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
        <LogIn size={13} className="text-accent" /> Masuk
      </p>
      <p className="mb-3 text-[11px] leading-relaxed text-muted/80">
        Masuk untuk menyimpan & menyinkronkan riwayat pencarian lintas perangkat.
      </p>

      <button
        onClick={auth.signInGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface/40 py-2 text-[13px] font-medium text-fg transition-colors hover:border-accent/40 hover:bg-surface/60"
      >
        <GoogleIcon /> Lanjut dengan Google
      </button>

      <div className="my-3 flex items-center gap-2 text-[10px] text-muted/50">
        <span className="h-px flex-1 bg-border/50" /> atau email <span className="h-px flex-1 bg-border/50" />
      </div>

      {sent ? (
        <p className="flex items-start gap-2 rounded-xl border border-pro/25 bg-pro/5 p-2.5 text-[12px] text-pro/90">
          <Check size={14} className="mt-0.5 shrink-0" /> Tautan masuk dikirim ke {email}. Cek inbox kamu.
        </p>
      ) : (
        <form onSubmit={sendMagicLink} className="flex items-center gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@kamu.com"
            className="min-w-0 flex-1 rounded-xl border border-border/60 bg-surface/30 px-3 py-2 text-[13px] text-fg placeholder:text-muted/50 outline-none focus:border-accent/40"
          />
          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 text-accent transition-colors hover:bg-accent/25 disabled:opacity-40"
            aria-label="Kirim tautan masuk"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-[12px] text-con/80">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.1 29.5 3 24 3 16 3 9.1 7.6 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.9 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9.1 42.3 16 45 24 45z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C40.9 36 44 30.6 44 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
