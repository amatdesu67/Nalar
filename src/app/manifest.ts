import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nalar — Mesin Pencari Bukti Ilmiah",
    short_name: "Nalar",
    description:
      "Berargumen dengan bukti. Cari jawaban atas klaim & topik debat dengan dukungan paper akademik.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c0b0a",
    theme_color: "#0c0b0a",
    lang: "id",
    categories: ["education", "productivity", "news"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
