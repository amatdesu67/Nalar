"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "nalar:pwa-dismissed";

export function PwaManager() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  // Daftarkan service worker (hanya di produksi agar tak ganggu HMR dev).
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // Tangkap prompt install bawaan browser, tampilkan CTA kita sendiri.
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      if (localStorage.getItem(DISMISS_KEY)) return;
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setShow(false);
    setDeferred(null);
  }

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-accent/25 bg-surface/95 p-3.5 shadow-2xl backdrop-blur md:left-auto md:right-4 md:mx-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/25">
        <Download size={18} className="text-accent" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-fg">Install Nalar</p>
        <p className="text-[11px] text-muted">Akses cepat & bisa dibuka offline dari layar HP-mu.</p>
      </div>
      <button
        onClick={install}
        className="shrink-0 rounded-lg bg-accent/15 border border-accent/30 px-3 py-1.5 text-[12px] font-semibold text-accent transition-colors hover:bg-accent/25"
      >
        Install
      </button>
      <button onClick={dismiss} className="shrink-0 text-muted/60 transition-colors hover:text-fg" aria-label="Tutup">
        <X size={16} />
      </button>
    </div>
  );
}
