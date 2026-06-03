import { describe, it, expect } from "vitest";
import { htmlToText, htmlTitle, isSafePublicUrl, parseClaims } from "@/lib/extract/html-text";

describe("htmlToText", () => {
  it("membuang script/style dan tag, menyisakan teks", () => {
    const html = `<html><head><style>.a{}</style></head><body><h1>Judul</h1><script>evil()</script><p>Isi &amp; lanjut</p></body></html>`;
    const out = htmlToText(html);
    expect(out).toContain("Judul");
    expect(out).toContain("Isi & lanjut");
    expect(out).not.toContain("evil");
    expect(out).not.toContain("{");
  });

  it("memisahkan blok dengan baris baru", () => {
    expect(htmlToText("<p>satu</p><p>dua</p>")).toBe("satu\ndua");
  });
});

describe("htmlTitle", () => {
  it("mengambil isi <title>", () => {
    expect(htmlTitle("<title>Halo Dunia</title>")).toBe("Halo Dunia");
  });
  it("null bila tak ada", () => {
    expect(htmlTitle("<p>x</p>")).toBeNull();
  });
});

describe("isSafePublicUrl", () => {
  it("mengizinkan http(s) publik", () => {
    expect(isSafePublicUrl("https://kompas.com/berita")).toBe(true);
    expect(isSafePublicUrl("http://example.org")).toBe(true);
  });
  it("menolak skema non-http", () => {
    expect(isSafePublicUrl("ftp://example.com")).toBe(false);
    expect(isSafePublicUrl("file:///etc/passwd")).toBe(false);
  });
  it("menolak localhost & IP privat (anti-SSRF)", () => {
    expect(isSafePublicUrl("http://localhost:3000")).toBe(false);
    expect(isSafePublicUrl("http://127.0.0.1")).toBe(false);
    expect(isSafePublicUrl("http://192.168.1.1")).toBe(false);
    expect(isSafePublicUrl("http://10.0.0.5")).toBe(false);
    expect(isSafePublicUrl("http://172.16.0.1")).toBe(false);
    expect(isSafePublicUrl("http://169.254.169.254")).toBe(false);
  });
  it("menolak input bukan URL", () => {
    expect(isSafePublicUrl("bukan url")).toBe(false);
  });
});

describe("parseClaims", () => {
  it("mengurai array JSON walau ada teks pembungkus", () => {
    const raw = 'Berikut klaimnya:\n["Klaim satu yang panjang", "Klaim dua yang juga panjang"] selesai';
    expect(parseClaims(raw)).toEqual(["Klaim satu yang panjang", "Klaim dua yang juga panjang"]);
  });
  it("membuang yang terlalu pendek dan non-string", () => {
    expect(parseClaims('["ok", "x", 5, "klaim valid panjang"]')).toEqual(["klaim valid panjang"]);
  });
  it("array kosong saat tak ada JSON", () => {
    expect(parseClaims("tidak ada apa-apa")).toEqual([]);
  });
});
