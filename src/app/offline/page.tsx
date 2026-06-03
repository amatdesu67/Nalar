import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10">
        <WifiOff size={26} className="text-accent" />
      </span>
      <h1 className="font-serif text-2xl font-bold text-fg">Sedang offline</h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted">
        Kamu tidak terhubung ke internet. Riwayat pencarian yang tersimpan tetap bisa dibuka, tapi
        analisa baru butuh koneksi. Coba lagi setelah online.
      </p>
    </main>
  );
}
