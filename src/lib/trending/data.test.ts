import { describe, it, expect } from "vitest";
import { mergeTrending, matchTrendingId, normalizeClaim, type TrendingClaim } from "@/lib/trending/data";

const seed: TrendingClaim[] = [
  { id: "a", claim: "Klaim A", category: "X", seeded: true },
  { id: "b", claim: "Klaim B", category: "X", seeded: true },
];

describe("mergeTrending", () => {
  it("melampirkan counter dan mengurutkan dari paling banyak dicari", () => {
    const out = mergeTrending(seed, [], { a: 2, b: 9 });
    expect(out.map((c) => c.id)).toEqual(["b", "a"]);
    expect(out[0].count).toBe(9);
  });

  it("menggabungkan custom dan membuang duplikat teks (case-insensitive)", () => {
    const custom: TrendingClaim[] = [
      { id: "c", claim: "Klaim C baru", category: "Y" },
      { id: "dup", claim: "  klaim a  ", category: "Z" }, // duplikat dari seed "a"
    ];
    const out = mergeTrending(seed, custom, {});
    const claims = out.map((c) => normalizeClaim(c.claim));
    expect(out).toHaveLength(3); // a, b, c — dup dibuang
    expect(claims).toContain("klaim c baru");
  });
});

describe("matchTrendingId", () => {
  it("mengembalikan id saat teks cocok (toleran spasi/huruf)", () => {
    expect(matchTrendingId("  KLAIM b ", seed)).toBe("b");
  });
  it("null saat tidak ada yang cocok", () => {
    expect(matchTrendingId("entah apa", seed)).toBeNull();
  });
});
