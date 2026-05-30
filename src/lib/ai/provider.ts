// Lapisan provider AI tunggal. Pilih lewat env AI_PROVIDER.
// - "groq"      : gratis, cepat (default). Model: meta-llama/llama-4-scout-17b-16e-instruct
// - "openai"    : OpenAI resmi
// - "anthropic" : Claude
// Endpoint Groq & OpenAI memakai format chat-completions yang kompatibel.

type Provider = "groq" | "openai" | "anthropic";

interface ChatOptions {
  system: string;
  user: string;
  maxTokens: number;
  json?: boolean; // minta mode JSON jika provider mendukung
}

interface ProviderConfig {
  provider: Provider;
  apiKey: string;
  model: string;
  baseUrl: string;
}

const DEFAULTS: Record<Provider, { baseUrl: string; model: string; envKey: string }> = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    envKey: "GROQ_API_KEY",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    envKey: "OPENAI_API_KEY",
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-sonnet-4-5-20250929",
    envKey: "ANTHROPIC_API_KEY",
  },
};

function resolveConfig(): ProviderConfig {
  const provider = (process.env.AI_PROVIDER as Provider) || "groq";
  const d = DEFAULTS[provider];
  if (!d) throw new Error(`AI_PROVIDER tidak valid: ${provider}`);

  const apiKey = process.env[d.envKey];
  if (!apiKey) {
    throw new Error(`${d.envKey} belum diset di .env (provider: ${provider}). Lihat README.`);
  }
  return {
    provider,
    apiKey,
    model: process.env.AI_MODEL || d.model,
    baseUrl: d.baseUrl,
  };
}

// --- OpenAI-compatible (Groq & OpenAI) ---
async function chatOpenAICompat(cfg: ProviderConfig, o: ChatOptions): Promise<string> {
  const body: Record<string, unknown> = {
    model: cfg.model,
    max_tokens: o.maxTokens,
    temperature: 0.3,
    messages: [
      { role: "system", content: o.system },
      { role: "user", content: o.user },
    ],
  };
  // Mode JSON didukung Groq & OpenAI (response_format).
  if (o.json) body.response_format = { type: "json_object" };

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${cfg.provider} error ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// --- Anthropic Messages API ---
async function chatAnthropic(cfg: ProviderConfig, o: ChatOptions): Promise<string> {
  const res = await fetch(`${cfg.baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: o.maxTokens,
      system: o.system,
      messages: [{ role: "user", content: o.user }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`anthropic error ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n");
}

export async function chat(o: ChatOptions): Promise<string> {
  const cfg = resolveConfig();
  return cfg.provider === "anthropic"
    ? chatAnthropic(cfg, o)
    : chatOpenAICompat(cfg, o);
}

export function activeProvider(): string {
  const provider = (process.env.AI_PROVIDER as Provider) || "groq";
  return `${provider}/${process.env.AI_MODEL || DEFAULTS[provider]?.model}`;
}
