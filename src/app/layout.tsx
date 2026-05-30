import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rizaai.vercel.app";
const TITLE = "RizaAi — Mesin Pencari Bukti Ilmiah";
const DESCRIPTION =
  "Cari jawaban atas klaim, opini, dan topik debat dengan dukungan paper akademik. Analisis netral berbasis bukti — lihat kedua sisi argumen, kualitas sumber, dan tingkat konsensus ilmiah.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s — RizaAi",
  },
  description: DESCRIPTION,
  keywords: [
    "bukti ilmiah",
    "paper akademik",
    "analisis klaim",
    "konsensus ilmiah",
    "OpenAlex",
    "fact check",
    "RizaAi",
  ],
  applicationName: "RizaAi",
  authors: [{ name: "RizaAi" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "RizaAi",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="relative min-h-screen antialiased">{children}</body>
    </html>
  );
}
