// Service worker: context menu "Cek di Nalar" untuk teks terpilih.
const MENU_ID = "nalar-check-selection";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Cek di Nalar: "%s"',
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;
  const claim = info.selectionText.trim().slice(0, 300);
  if (claim.length < 5) return;
  const stored = await chrome.storage.sync.get({ base: "https://nalar.vercel.app" });
  const base = (stored.base || "https://nalar.vercel.app").replace(/\/$/, "");
  await chrome.tabs.create({ url: `${base}/?q=${encodeURIComponent(claim)}` });
});
