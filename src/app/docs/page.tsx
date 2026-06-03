import Link from "next/link";
import { ArrowLeft, Terminal, KeyRound, Gauge } from "lucide-react";

export const metadata = {
  title: "API Publik",
  description: "Dokumentasi REST API Nalar untuk menganalisa klaim secara terprogram.",
};

const CURL = `curl -X POST https://nalar.vercel.app/api/v1/analyze \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: NALAR_API_KEY_KAMU" \\
  -d '{"claim": "Vitamin C dosis tinggi menyembuhkan flu"}'`;

const JS = `const res = await fetch("https://nalar.vercel.app/api/v1/analyze", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.NALAR_API_KEY,
  },
  body: JSON.stringify({ claim: "Vitamin C dosis tinggi menyembuhkan flu" }),
});
const data = await res.json();
console.log(data.consensus, data.summary);`;

const RESPONSE = `{
  "claim": "Vitamin C dosis tinggi menyembuhkan flu",
  "consensus": "mixed",
  "confidence": 58,
  "summary": "Sebagian besar uji klinis tidak menemukan ...",
  "papersAnalyzed": 12,
  "papers": [
    {
      "title": "Vitamin C for preventing and treating the common cold",
      "authors": ["Hemilä H", "Chalker E"],
      "year": 2013,
      "doi": "10.1002/14651858.CD000980.pub4",
      "url": "https://doi.org/10.1002/...",
      "venue": "Cochrane Database",
      "citationCount": 1200,
      "isOpenAccess": true,
      "isRetracted": false
    }
  ]
}`;

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border/60 bg-surface/40 p-4 text-[12.5px] leading-relaxed text-fg/85">
      <code>{children}</code>
    </pre>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-fg">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent">
        <ArrowLeft size={15} /> Beranda
      </Link>

      <header className="mb-10 space-y-2">
        <h1 className="font-serif text-3xl font-bold text-gradient-gold">API Publik Nalar</h1>
        <p className="text-sm leading-relaxed text-muted">
          Analisa klaim secara terprogram: kirim klaim, terima konsensus ilmiah, ringkasan, dan daftar
          paper pendukung dalam JSON.
        </p>
      </header>

      <div className="space-y-10">
        <Section icon={<Terminal size={17} className="text-accent" />} title="Endpoint">
          <p className="text-[13px] text-muted">
            <code className="rounded bg-surface/60 px-1.5 py-0.5 font-mono text-accent">POST</code>{" "}
            <code className="font-mono text-fg/90">/api/v1/analyze</code>
          </p>
          <p className="text-[13px] leading-relaxed text-muted">
            Body JSON: <code className="font-mono text-fg/90">{`{ "claim": string }`}</code> — pertanyaan/klaim
            yang ingin diuji (5–300 karakter).
          </p>
        </Section>

        <Section icon={<KeyRound size={17} className="text-accent" />} title="Autentikasi">
          <p className="text-[13px] leading-relaxed text-muted">
            Sertakan API key di header <code className="font-mono text-fg/90">x-api-key</code> atau{" "}
            <code className="font-mono text-fg/90">Authorization: Bearer &lt;key&gt;</code>. Minta key ke
            pengelola; set di server lewat env <code className="font-mono text-fg/90">NALAR_API_KEYS</code>.
          </p>
        </Section>

        <Section icon={<Gauge size={17} className="text-accent" />} title="Rate limit">
          <p className="text-[13px] leading-relaxed text-muted">
            30 permintaan / menit per API key. Saat terlampaui, server membalas{" "}
            <code className="font-mono text-fg/90">429</code> dengan header{" "}
            <code className="font-mono text-fg/90">Retry-After</code>. Sisa kuota ada di{" "}
            <code className="font-mono text-fg/90">X-RateLimit-Remaining</code>.
          </p>
        </Section>

        <Section icon={<Terminal size={17} className="text-accent" />} title="Contoh — cURL">
          <Code>{CURL}</Code>
        </Section>

        <Section icon={<Terminal size={17} className="text-accent" />} title="Contoh — JavaScript">
          <Code>{JS}</Code>
        </Section>

        <Section icon={<Terminal size={17} className="text-accent" />} title="Contoh respons (200)">
          <Code>{RESPONSE}</Code>
        </Section>

        <Section icon={<Gauge size={17} className="text-accent" />} title="Kode error">
          <ul className="space-y-1.5 text-[13px] text-muted">
            <li><code className="font-mono text-accent">400</code> — body/claim tidak valid</li>
            <li><code className="font-mono text-accent">401</code> — API key tidak disertakan</li>
            <li><code className="font-mono text-accent">403</code> — API key tidak valid</li>
            <li><code className="font-mono text-accent">404</code> — tidak ada paper relevan</li>
            <li><code className="font-mono text-accent">429</code> — rate limit terlampaui</li>
            <li><code className="font-mono text-accent">503</code> — API publik nonaktif / AI sibuk</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
