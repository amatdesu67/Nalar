# RizaAi

Mesin pencari **argumen & bukti ilmiah** berbasis paper akademik. Ketik pertanyaan/klaim/topik debat dalam bahasa awam → RizaAi mengubahnya jadi keyword akademik, menarik paper relevan dari OpenAlex, menilai kualitas tiap sumber, lalu menganalisis bukti secara netral dengan AI.

Terinspirasi Perplexity (jawaban + sumber), Notion (kebersihan), Linear (presisi). Dark mode, animasi halus, komponen reusable.

---

## ✨ Fitur (MVP — Stage 1)

- **Search → analisis otomatis.** Tanpa upload PDF, tanpa cari jurnal manual.
- **Ringkasan netral** + jumlah paper, **tingkat konsensus** ilmiah, dan **tingkat keyakinan** (0–100).
- **Bukti dua sisi** — poin yang *mendukung* vs *menentang* klaim, masing-masing dengan kekuatan bukti & rujukan paper `[n]`.
- **Debate Mode** — argumen PRO & KONTRA, kelemahan tiap posisi, deteksi **logical fallacy**.
- **Mode "Jelaskan untuk Anak SMA"** — terjemahan hasil ke bahasa sederhana, satu klik.
- **Source Quality Analyzer** (deterministik, tanpa AI) — skor 0–100 per paper berdasarkan jenis studi (meta-analysis / systematic review / RCT / kohort / observasional / preprint…), sitasi (log-scaled), recency, open access, ukuran sampel, status peer-review; menampilkan sinyal & peringatan bias.
- **Tiap paper**: judul, penulis, tahun, sitasi, DOI, open-access, link sumber asli.
- **Riwayat & statistik** pencarian (localStorage di MVP).

## 🧱 Stack

Next.js 15 (App Router) · TypeScript · Tailwind · komponen ala shadcn (Radix) · **provider AI yang bisa diganti** (Groq / OpenAI / Anthropic) · OpenAlex (data paper) · Prisma + PostgreSQL (disiapkan untuk Stage 2).

## 🗂 Struktur

```
src/
  app/
    api/analyze/route.ts     # endpoint POST: question -> AnalysisResult
    page.tsx                 # dashboard (search, hasil, riwayat, statistik)
    layout.tsx · globals.css # tema dark akademik
  lib/
    types.ts                 # kontrak data tunggal
    academic/
      openalex.ts            # klien OpenAlex + rekonstruksi abstrak
      quality.ts             # Source Quality Analyzer (murni, ter-uji)
    ai/
      prompts.ts             # prompt keyword + analisis
      analyze.ts             # orkestrasi: keyword -> search -> score -> AI
    labels.ts · utils.ts · use-history.ts
  components/
    search-bar · result-view · evidence-column · debate-mode
    confidence-meter · paper-card · loading-state · ui/*
prisma/schema.prisma         # model Stage 2
```

Arsitektur: UI ← API route ← `lib/ai/analyze` (orkestrator) ← sumber (`academic/*`, `ai/*`). Sumber akademik di-abstraksi sehingga PubMed/Crossref/Semantic Scholar bisa ditambah tanpa menyentuh UI.

## 🚀 Menjalankan

```bash
npm install
cp .env.example .env        # isi GROQ_API_KEY
npm run dev                 # http://localhost:3000
```

### Provider AI (gratis dengan Groq)

RizaAi memakai lapisan provider tunggal (`src/lib/ai/provider.ts`). Ganti model **lewat env saja**, tanpa ubah kode.

**Groq — gratis, tanpa kartu kredit (default & disarankan untuk mulai):**
1. Buat key di https://console.groq.com/keys
2. Di `.env`:
   ```
   AI_PROVIDER=groq
   GROQ_API_KEY=gsk_xxxx
   # AI_MODEL kosong = pakai Llama 4 Scout (meta-llama/llama-4-scout-17b-16e-instruct)
   ```
Free tier Groq ±30k token/menit, 14.400 request/hari — cukup untuk MVP.

> Scout (17B aktif) cepat tapi penalarannya di bawah model frontier; kadang JSON kurang rapi (sudah ditangani parser toleran). Jika hasil analisis terasa dangkal, set `AI_MODEL=openai/gpt-oss-120b` — masih gratis di Groq, reasoning lebih baik.

**OpenAI / Anthropic (berbayar, kualitas lebih tinggi):**
```
AI_PROVIDER=openai      # atau anthropic
OPENAI_API_KEY=sk-xxxx  # atau ANTHROPIC_API_KEY=sk-ant-xxxx
AI_MODEL=               # kosong = default tiap provider
```

`OPENALEX_MAILTO` opsional (akses OpenAlex lebih cepat). Tanpa DB pun jalan.

### Catatan font
Build di lingkungan ini memakai CSS font-stack (sandbox memblokir Google Fonts). Untuk hasil desain terbaik, kembalikan `next/font` di `layout.tsx`:

```ts
import { Fraunces, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
// ...pasang variable di <html> seperti versi awal.
```

## 🛣 Roadmap

- **Stage 1 (selesai)** — core loop: search → OpenAlex → quality → analisis AI → UI dua sisi + Debate + ELI.
- **Stage 2** — auth (email + Google), simpan riwayat ke PostgreSQL (`prisma db push`), cache paper.
- **Stage 3** — sumber tambahan (PubMed, Crossref, Semantic Scholar) + agregasi lintas-sumber; full-text bila open access.
- **Stage 4** — ekspor PDF laporan, share link, perbandingan dua klaim.

## ⚠️ Disclaimer
Ringkasan disusun dari **abstrak** paper publik dan bisa keliru. Selalu verifikasi ke sumber asli sebelum keputusan penting (terutama medis).
