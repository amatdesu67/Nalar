import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RizaAi — Mesin Pencari Bukti Ilmiah",
  description:
    "Cari jawaban atas klaim, opini, dan topik debat dengan dukungan paper akademik. Analisis netral berbasis bukti.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="relative min-h-screen antialiased">{children}</body>
    </html>
  );
}
