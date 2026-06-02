# Bot WhatsApp Nalar (Baileys / QR pairing)

Bot WhatsApp yang konek lewat **scan QR** memakai nomor pribadi (library
[Baileys](https://github.com/WhiskeySockets/Baileys), tanpa Cloud API resmi).
User kirim klaim → bot memanggil API Nalar (`/api/analyze`) → balas ringkasan:
tingkat konsensus, jumlah paper pro/kontra, dan 2–3 paper teratas + link.

> ⚠️ **Peringatan:** Baileys itu *unofficial* (reverse-engineered WhatsApp Web).
> Penggunaan otomatis berisiko melanggar ToS WhatsApp dan nomor bisa diblokir.
> **Gunakan nomor sekunder**, jangan nomor utama. Untuk produksi, pakai jalur
> resmi WhatsApp Cloud API (lihat `../docs/whatsapp-bot.md`).

## Prasyarat

- Node.js **18+** (butuh `fetch` global).
- App Nalar berjalan & bisa diakses. Default bot menembak
  `http://localhost:3000/api/analyze`. Pastikan `npm run dev` Nalar jalan,
  atau set `NALAR_API_URL` ke URL produksi.

## Jalankan

```bash
cd whatsapp-bot
npm install
npm start
```

Saat pertama jalan, **QR code muncul di terminal**. Buka WhatsApp di HP:

> **Setelan → Perangkat tertaut → Tautkan perangkat** → scan QR di terminal.

Setelah tertaut, sesi disimpan di folder `./auth` (lewat `useMultiFileAuthState`),
jadi **restart tidak perlu scan ulang**. Kalau koneksi putus, bot
**auto-reconnect** sendiri. Kalau sesi logout, hapus folder `./auth` lalu
`npm start` lagi untuk scan QR baru.

## Konfigurasi (env opsional)

| Variabel        | Default                              | Keterangan                          |
| --------------- | ------------------------------------ | ----------------------------------- |
| `NALAR_API_URL` | `http://localhost:3000/api/analyze`  | Endpoint analyze Nalar              |

Contoh pakai API produksi:

```bash
# Windows PowerShell
$env:NALAR_API_URL="https://nalar-kamu.vercel.app/api/analyze"; npm start

# macOS / Linux
NALAR_API_URL="https://nalar-kamu.vercel.app/api/analyze" npm start
```

## Perilaku

- Hanya membalas chat pribadi; grup & status broadcast diabaikan.
- Pesan terlalu pendek / sapaan → kirim pesan bantuan cara pakai.
- **Rate limit**: maksimal 5 pesan / menit per nomor (anti-spam).
- Balasan pakai `*tebal*`, `_miring_`, dan emoji ala WhatsApp.

## File

- `index.js` — koneksi Baileys, event handler, rate limit, panggil API.
- `format.js` — `formatReply()` (hasil → teks WA) & teks bantuan.
- `auth/` — sesi login (dibuat otomatis, **jangan di-commit**; sudah di `.gitignore`).
