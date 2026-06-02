import { describe, it, expect } from "vitest";
import { rateLimit, clientIp } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("izinkan sampai batas lalu blokir", () => {
    const key = `test:allow:${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000).ok).toBe(true);
    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });
  it("mengurangi sisa kuota", () => {
    const key = `test:remaining:${Math.random()}`;
    expect(rateLimit(key, 5, 60_000).remaining).toBe(4);
    expect(rateLimit(key, 5, 60_000).remaining).toBe(3);
  });
  it("reset setelah window", async () => {
    const key = `test:reset:${Math.random()}`;
    rateLimit(key, 1, 1);
    expect(rateLimit(key, 1, 1).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 5));
    expect(rateLimit(key, 1, 1).ok).toBe(true);
  });
  it("kunci berbeda terpisah", () => {
    const a = `test:a:${Math.random()}`;
    const b = `test:b:${Math.random()}`;
    rateLimit(a, 1, 60_000);
    expect(rateLimit(a, 1, 60_000).ok).toBe(false);
    expect(rateLimit(b, 1, 60_000).ok).toBe(true);
  });
});

describe("clientIp", () => {
  it("ambil IP pertama dari x-forwarded-for", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });
  it("fallback ke x-real-ip", () => {
    expect(clientIp(new Headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });
  it("'unknown' bila tak ada header", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
