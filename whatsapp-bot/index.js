// Bot WhatsApp Nalar via Baileys (QR pairing, nomor pribadi).
// Listen pesan masuk -> panggil API Nalar (/api/analyze) -> balas ringkasan.

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const pino = require("pino");
const fs = require("fs");

const { formatReply, HELP_TEXT } = require("./format");

// --- Konfigurasi ---
const NALAR_API_URL = process.env.NALAR_API_URL || "http://localhost:3000/api/analyze";
const AUTH_DIR = "./auth";
// Login pakai pairing code (kode 8-digit) alih-alih scan QR. Isi nomor format
// internasional tanpa "+" dan tanpa "0" depan, mis. 6283842570278. Kosongkan
// untuk pakai QR. Berguna kalau bot jalan di server tanpa layar.
const PAIRING_NUMBER = (process.env.WA_PAIRING_NUMBER || "").replace(/\D/g, "");
const RATE_LIMIT_MAX = 5; // pesan per jendela
const RATE_LIMIT_WINDOW_MS = 60_000;
const MIN_CLAIM_LEN = 8; // di bawah ini dianggap bukan klaim -> kirim bantuan

// Hitung percobaan login ulang setelah logout, agar tidak loop tak terbatas.
let logoutRetries = 0;

// --- Rate limit sederhana per nomor (fixed window, in-memory) ---
const rateStore = new Map();
function rateLimited(jid) {
  const now = Date.now();
  const hit = rateStore.get(jid);
  if (!hit || hit.resetAt <= now) {
    rateStore.set(jid, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  hit.count += 1;
  return hit.count > RATE_LIMIT_MAX;
}

// --- Panggil API Nalar ---
async function analyzeClaim(question) {
  const res = await fetch(NALAR_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `API Nalar error ${res.status}`);
  }
  return data;
}

// Ambil teks dari berbagai bentuk pesan WhatsApp.
function extractText(msg) {
  const m = msg.message || {};
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    ""
  ).trim();
}

async function handleIncoming(sock, msg) {
  const jid = msg.key.remoteJid;
  // Abaikan pesan dari diri sendiri, grup, dan status broadcast.
  if (!jid || msg.key.fromMe) return;
  if (jid.endsWith("@g.us") || jid === "status@broadcast") return;

  const text = extractText(msg);
  if (!text) return;

  if (rateLimited(jid)) {
    await sock.sendMessage(jid, {
      text: "⏳ Terlalu banyak permintaan. Coba lagi sebentar lagi ya.",
    });
    return;
  }

  // Pesan terlalu pendek / sapaan -> kirim bantuan.
  if (text.length < MIN_CLAIM_LEN) {
    await sock.sendMessage(jid, { text: HELP_TEXT });
    return;
  }

  try {
    await sock.sendPresenceUpdate("composing", jid);
    await sock.sendMessage(jid, {
      text: "🔬 Sebentar ya, sedang mencari & menganalisis bukti ilmiah…",
    });
    const result = await analyzeClaim(text);
    await sock.sendMessage(jid, { text: formatReply(result) });
  } catch (err) {
    const m = String(err.message || "").toLowerCase();
    const friendly = m.includes("tidak ada paper")
      ? "Tidak menemukan paper relevan. Coba klaim yang lebih spesifik."
      : m.includes("pendek") || m.includes("valid")
        ? err.message
        : "Maaf, terjadi kendala saat menganalisis. Coba lagi sebentar lagi.";
    await sock.sendMessage(jid, { text: `⚠️ ${friendly}` }).catch(() => {});
  } finally {
    await sock.sendPresenceUpdate("paused", jid).catch(() => {});
  }
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    // QR ditangani manual lewat event di bawah (printQRInTerminal deprecated).
    printQRInTerminal: false,
    // Set WA_DEBUG=1 untuk melihat log Baileys (mendiagnosa kegagalan pairing).
    logger: pino({ level: process.env.WA_DEBUG ? "debug" : "silent" }),
    // WhatsApp memvalidasi string browser saat pairing code; pakai helper
    // bawaan Baileys (bukan array custom) agar linking tidak ditolak.
    browser: Browsers.ubuntu("Chrome"),
  });

  sock.ev.on("creds.update", saveCreds);

  // Login via pairing code (sekali, saat belum terdaftar). Beri jeda singkat
  // agar socket siap sebelum meminta kode.
  if (PAIRING_NUMBER && !sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(PAIRING_NUMBER);
        const pretty = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log("\n🔢 Pairing code:", pretty);
        console.log("   Buka WhatsApp > Perangkat tertaut > Tautkan dengan nomor telepon, lalu masukkan kode di atas.\n");
      } catch (e) {
        console.error("Gagal meminta pairing code:", e?.message || e);
      }
    }, 3000);
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Hanya tampilkan QR bila TIDAK memakai pairing code.
    if (qr && !PAIRING_NUMBER) {
      console.log("\n📱 Scan QR ini di WhatsApp > Perangkat tertaut > Tautkan perangkat:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      logoutRetries = 0;
      console.log("✅ Bot Nalar terhubung ke WhatsApp.");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      if (loggedOut) {
        // 401 bisa berarti sesi ./auth basi/korup (jebakan login pertama) atau
        // perangkat di-unlink. Dua-duanya: sesi mati -> bersihkan & login ulang.
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        } catch {}
        if (logoutRetries++ < 3) {
          console.log("❌ Sesi tidak valid/logout — membersihkan ./auth & memulai ulang untuk login baru…");
          setTimeout(start, 2000);
        } else {
          console.log("❌ Gagal login berulang. Hapus folder ./auth manual, cek nomor/koneksi, lalu jalankan ulang.");
        }
      } else {
        console.log(`🔄 Koneksi putus (code ${statusCode ?? "?"}), mencoba menyambung ulang…`);
        start();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return; // hanya pesan baru
    for (const msg of messages) {
      try {
        await handleIncoming(sock, msg);
      } catch (e) {
        console.error("Gagal memproses pesan:", e);
      }
    }
  });
}

start().catch((e) => {
  console.error("Gagal memulai bot:", e);
  process.exit(1);
});
