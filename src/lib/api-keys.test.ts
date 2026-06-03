import { describe, it, expect } from "vitest";
import { parseApiKeys, extractApiKey, authenticate } from "@/lib/api-keys";

describe("parseApiKeys", () => {
  it("memecah daftar dipisah koma dan merapikan spasi", () => {
    const set = parseApiKeys(" a , b ,, c ");
    expect([...set].sort()).toEqual(["a", "b", "c"]);
  });
  it("kosong saat env tidak diset", () => {
    expect(parseApiKeys(undefined).size).toBe(0);
  });
});

describe("extractApiKey", () => {
  it("dari header x-api-key", () => {
    expect(extractApiKey(new Headers({ "x-api-key": "k1" }))).toBe("k1");
  });
  it("dari Authorization Bearer", () => {
    expect(extractApiKey(new Headers({ authorization: "Bearer k2" }))).toBe("k2");
  });
  it("null bila tidak ada", () => {
    expect(extractApiKey(new Headers())).toBeNull();
  });
});

describe("authenticate", () => {
  const keys = new Set(["secret"]);
  it("503 saat API publik nonaktif (tanpa key terdaftar)", () => {
    expect(authenticate(new Headers({ "x-api-key": "x" }), new Set()).status).toBe(503);
  });
  it("401 saat tidak ada key", () => {
    expect(authenticate(new Headers(), keys).status).toBe(401);
  });
  it("403 saat key salah", () => {
    expect(authenticate(new Headers({ "x-api-key": "salah" }), keys).status).toBe(403);
  });
  it("ok saat key benar", () => {
    const r = authenticate(new Headers({ "x-api-key": "secret" }), keys);
    expect(r.ok).toBe(true);
    expect(r.key).toBe("secret");
  });
});
