import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaManager } from "@/components/pwa";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nalar.vercel.app";
const TITLE = "Nalar — Mesin Pencari Bukti Ilmiah";
const DESCRIPTION =
  "Berargumen dengan bukti. Cari jawaban atas klaim, opini, dan topik debat dengan dukungan paper akademik — analisis netral, kedua sisi argumen, kualitas sumber, dan tingkat konsensus ilmiah.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s — Nalar",
  },
  description: DESCRIPTION,
  keywords: [
    "bukti ilmiah",
    "paper akademik",
    "analisis klaim",
    "konsensus ilmiah",
    "OpenAlex",
    "fact check",
    "Nalar",
  ],
  applicationName: "Nalar",
  authors: [{ name: "Nalar" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "Nalar",
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
  appleWebApp: {
    capable: true,
    title: "Nalar",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0b0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="relative min-h-screen antialiased">
        {children}
        <PwaManager />
      </body>
    </html>
  );
}
