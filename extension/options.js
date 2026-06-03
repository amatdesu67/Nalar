const DEFAULTS = { base: "https://nalar.vercel.app", apiKey: "" };
const baseEl = document.getElementById("base");
const keyEl = document.getElementById("apiKey");
const savedEl = document.getElementById("saved");

chrome.storage.sync.get(DEFAULTS).then((s) => {
  baseEl.value = s.base || DEFAULTS.base;
  keyEl.value = s.apiKey || "";
});

document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.sync.set({
    base: baseEl.value.trim() || DEFAULTS.base,
    apiKey: keyEl.value.trim(),
  });
  savedEl.textContent = "Tersimpan ✓";
  setTimeout(() => (savedEl.textContent = ""), 1500);
});
