import { describe, it, expect } from "vitest";
import { analyzeDiversity } from "@/lib/diversity";
import type { Paper } from "@/lib/types";

function paper(over: Partial<Paper> = {}): Paper {
  return {
    id: "P",
    title: "t",
    abstract: null,
    authors: [],
    year: 2020,
    venue: null,
    citationCount: 0,
    doi: null,
    url: "u",
    isOpenAccess: false,
    type: "article",
    isRetracted: false,
    field: "Medicine",
    institutions: [],
    ...over,
  };
}

describe("analyzeDiversity", () => {
  it("menghitung author & institusi unik", () => {
    const r = analyzeDiversity([
      paper({ id: "1", authors: ["A", "B"], institutions: ["MIT"] }),
      paper({ id: "2", authors: ["B", "C"], institutions: ["Harvard"] }),
    ]);
    expect(r.uniqueAuthors).toBe(3); // A, B, C
    expect(r.uniqueInstitutions).toBe(2); // MIT, Harvard
  });

  it("menandai konsentrasi bila satu institusi dominan (>=60%, >=3 paper)", () => {
    const r = analyzeDiversity([
      paper({ id: "1", institutions: ["MIT"] }),
      paper({ id: "2", institutions: ["MIT"] }),
      paper({ id: "3", institutions: ["MIT"] }),
      paper({ id: "4", institutions: ["Stanford"] }),
    ]);
    expect(r.concentrated).toBe(true);
    expect(r.topInstitution?.name).toBe("MIT");
    expect(r.note).toContain("MIT");
  });

  it("tidak menandai bila beragam", () => {
    const r = analyzeDiversity([
      paper({ id: "1", institutions: ["A"], authors: ["x"] }),
      paper({ id: "2", institutions: ["B"], authors: ["y"] }),
      paper({ id: "3", institutions: ["C"], authors: ["z"] }),
    ]);
    expect(r.concentrated).toBe(false);
    expect(r.note).toBeNull();
  });

  it("tidak menandai bila paper terlalu sedikit (<3) walau sama", () => {
    const r = analyzeDiversity([
      paper({ id: "1", institutions: ["MIT"] }),
      paper({ id: "2", institutions: ["MIT"] }),
    ]);
    expect(r.concentrated).toBe(false);
  });

  it("aman saat tidak ada data institusi", () => {
    const r = analyzeDiversity([paper({ id: "1" }), paper({ id: "2" })]);
    expect(r.uniqueInstitutions).toBe(0);
    expect(r.topInstitution).toBeNull();
    expect(r.concentrated).toBe(false);
  });
});
