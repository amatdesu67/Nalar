# Nalar — Browser Extension (Manifest V3)

Highlight teks di web mana saja → klik kanan **“Cek di Nalar”**, atau buka popup
extension untuk mengecek klaim dengan bukti ilmiah.

## Fitur
- **Context menu** pada teks terpilih → buka analisa Nalar untuk teks itu.
- **Popup**: ketik/tempel klaim, lalu Analisa.
  - Tanpa API key → klaim dibuka di web app Nalar (`/?q=...`).
  - Dengan API key (set di Pengaturan) → ringkasan konsensus + paper tampil langsung di popup via `/api/v1/analyze`.
- **Pengaturan**: ganti URL instance Nalar & isi API key opsional.

## Cara install (mode pengembang)
1. Buka `chrome://extensions` (atau `edge://extensions`).
2. Aktifkan **Developer mode**.
3. Klik **Load unpacked**, pilih folder `extension/` ini.
4. (Opsional) buka **Pengaturan** extension untuk mengisi URL & API key.

## Struktur
- `manifest.json` — Manifest V3 (permissions: contextMenus, storage, activeTab, scripting).
- `background.js` — service worker: registrasi & handler context menu.
- `popup.html` / `popup.js` — UI popup + pemanggilan API publik.
- `options.html` / `options.js` — halaman pengaturan (base URL + API key).

## Catatan
- Ikon belum disertakan (opsional). Tambahkan `icon.png` + key `icons` di manifest bila perlu branding.
- API key untuk popup didapat dari pengelola Nalar; lihat halaman `/docs`.
