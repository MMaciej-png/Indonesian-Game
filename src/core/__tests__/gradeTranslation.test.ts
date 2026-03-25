import { describe, expect, it } from "vitest";
import { gradeTranslation, normalizeAnswer, similarityRatio } from "../gradeTranslation";
import type { ChallengeDef } from "../types";

const base: ChallengeDef = {
  id: "t",
  kind: "word",
  promptKey: "p",
  expected: "apa kabar",
  aliases: ["apa kabarnya", "gimana kabarnya"],
};

describe("gradeTranslation", () => {
  it("accepts exact normalized", () => {
    const g = gradeTranslation("  Apa Kabar! ", base);
    expect(g.verdict).toBe("correct");
  });

  it("accepts alias", () => {
    const g = gradeTranslation("gimana kabarnya", base);
    expect(g.verdict).toBe("correct");
  });

  it("uses fuzzy threshold", () => {
    const g = gradeTranslation("apa kabr", { ...base, fuzzyThreshold: 0.85 });
    expect(g.verdict).toMatch(/correct|close/);
  });

  it("respects word order flag", () => {
    const ch: ChallengeDef = {
      ...base,
      expected: "saya makan",
      allowWordOrderVariant: true,
      fuzzyThreshold: 0.95,
    };
    expect(gradeTranslation("makan saya", ch).verdict).toBe("correct");
    const strict: ChallengeDef = { ...ch, allowWordOrderVariant: false };
    expect(gradeTranslation("makan saya", strict).verdict).not.toBe("correct");
  });
});

describe("normalizeAnswer", () => {
  it("collapses space and lowercases", () => {
    expect(normalizeAnswer("  Halo! ")).toBe("halo");
  });
});

describe("similarityRatio", () => {
  it("is 1 for identical", () => {
    expect(similarityRatio("abc", "abc")).toBe(1);
  });
});
