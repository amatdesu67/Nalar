// Klien minimal WhatsApp Cloud API (Meta) untuk mengirim pesan teks.

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";

export function whatsappConfigured(): boolean {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendText(to: string, body: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) {
    throw new Error("WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID belum diset di .env");
  }

  const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      // preview_url true agar link paper bisa menampilkan pratinjau.
      text: { preview_url: true, body },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`WhatsApp send error ${res.status}: ${detail.slice(0, 300)}`);
  }
}
