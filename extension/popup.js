const DEFAULTS = { base: "https://nalar.vercel.app", apiKey: "" };

const $ = (id) => document.getElementById(id);
const claimEl = $("claim");
const goEl = $("go");
const resultEl = $("result");

async function getConfig() {
  const s = await chrome.storage.sync.get(DEFAULTS);
  return { base: (s.base || DEFAULTS.base).replace(/\/$/, ""), apiKey: s.apiKey || "" };
}

// Ambil teks yang sedang diseleksi di tab aktif (jika ada).
async function prefillSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const [res] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString(),
    });
    const sel = (res?.result || "").trim();
    if (sel) claimEl.value = sel.slice(0, 300);
  } catch {
    /* halaman terproteksi (mis. chrome://) — abaikan */
  }
}

const LABELS = {
  strong_support: "Bukti kuat mendukung",
  moderate_support: "Bukti cenderung mendukung",
  mixed: "Bukti terbelah",
  moderate_against: "Bukti cenderung menentang",
  strong_against: "Bukti kuat menentang",
  insufficient: "Bukti belum cukup",
};

async function openInApp(base, claim) {
  await chrome.tabs.create({ url: `${base}/?q=${encodeURIComponent(claim)}` });
  window.close();
}

async function analyze() {
  const claim = claimEl.value.trim();
  if (claim.length < 5) {
    resultEl.style.display = "block";
    resultEl.innerHTML = '<p class="err">Klaim terlalu pendek (min. 5 karakter).</p>';
    return;
  }
  const { base, apiKey } = await getConfig();

  // Tanpa API key: buka langsung di web app (analisa penuh di sana).
  if (!apiKey) return openInApp(base, claim);

  goEl.disabled = true;
  resultEl.style.display = "block";
  resultEl.innerHTML = '<p class="muted"><span class="spin">⏳</span> Menganalisa…</p>';
  try {
    const res = await fetch(`${base}/api/v1/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ claim }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menganalisa.");
    renderResult(base, claim, data);
  } catch (e) {
    resultEl.innerHTML = `<p class="err">${e.message}</p>`;
  } finally {
    goEl.disabled = false;
  }
}

function renderResult(base, claim, data) {
  const papers = (data.papers || [])
    .slice(0, 3)
    .map((p) => `<div class="paper"><a href="${p.url}" target="_blank">${p.title}</a> (${p.year ?? "n.d."})</div>`)
    .join("");
  resultEl.innerHTML = `
    <div class="meter"><b>${LABELS[data.consensus] || data.consensus}</b> · ${data.confidence}% keyakinan · ${data.papersAnalyzed} paper</div>
    <div class="summary">${data.summary || ""}</div>
    ${papers}
    <p class="muted"><a class="link" id="full" href="#">Buka analisa lengkap →</a></p>`;
  document.getElementById("full").addEventListener("click", (e) => {
    e.preventDefault();
    openInApp(base, claim);
  });
}

goEl.addEventListener("click", analyze);
claimEl.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") analyze();
});
$("opts").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

prefillSelection();
