# Bot WhatsApp Nalar

Integrasi bot WhatsApp memakai **WhatsApp Cloud API (Meta)**. User mengirim klaim
via WhatsApp, bot membalas ringkasan analisa Nalar (konsensus, jumlah paper
pro/kontra, 2–3 paper teratas + link).

## Arsitektur

- `src/app/api/whatsapp/route.ts` — webhook: `GET` untuk verifikasi, `POST` untuk
  pesan masuk. Membalas `200` cepat lalu memproses lewat `after()` (analisa bisa
  ~30–60 dtk; WhatsApp akan retry bila webhook lambat).
- `src/lib/whatsapp/format.ts` — `formatAnalysis()` mengubah hasil jadi teks WA
  (memakai `*tebal*`, `_miring_`, emoji). Fungsi murni & ada unit test-nya.
- `src/lib/whatsapp/client.ts` — `sendText()` mengirim balasan via Cloud API.

## Setup

1. **Buat app di Meta**: https://developers.facebook.com → buat app tipe *Business*
   → tambahkan produk **WhatsApp**.
2. Di **WhatsApp > API Setup**, catat **Phone number ID** dan buat **access token**
   (untuk produksi pakai *System User token* yang permanen).
3. Isi `.env`:
   ```
   WHATSAPP_VERIFY_TOKEN=token-rahasia-bebas   # tentukan sendiri
   WHATSAPP_TOKEN=EAAG...                       # access token Meta
   WHATSAPP_PHONE_NUMBER_ID=123456789012345
   # WHATSAPP_API_VERSION=v21.0                 # opsional
   ```
4. **Deploy** app (mis. Vercel) agar webhook punya URL publik HTTPS.
5. Di **WhatsApp > Configuration > Webhook**:
   - Callback URL: `https://<domain-kamu>/api/whatsapp`
   - Verify token: sama persis dengan `WHATSAPP_VERIFY_TOKEN`
   - Klik **Verify and save** (memicu `GET` handshake).
   - **Subscribe** ke field **messages**.

## Uji cepat

- Verifikasi webhook (harus mengembalikan `test123`):
  ```bash
  curl "https://<domain>/api/whatsapp?hub.mode=subscribe&hub.verify_token=<TOKEN>&hub.challenge=test123"
  ```
- Kirim pesan WhatsApp ke nomor bisnis kamu (di mode test, tambahkan nomormu
  sebagai recipient di dashboard). Bot membalas otomatis.

## Catatan produksi

- Webhook bersifat **at-least-once**: route sudah men-dedupe via `message.id`
  in-memory. Untuk lintas-instance (serverless) gunakan store bersama
  (mis. Redis) bila perlu jaminan ketat.
- Rate limit per pengirim: 5 analisa / menit (`wa:<from>`).
- Hanya pesan tipe `text` yang diproses; status delivery/read diabaikan.
