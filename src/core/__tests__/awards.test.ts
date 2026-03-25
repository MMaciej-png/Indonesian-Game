import { describe, expect, it } from "vitest";
import { computeAwards } from "../awards";
import type { CourseManifest, SkillTreeData } from "../types";

const economy = {
  baseCurrencyPerCorrect: 10,
  baseXpPerCorrect: 5,
  comboBonusPercentPerStep: 10,
  maxComboBonusPercent: 50,
  currencyNameKey: "x",
  maxStackedCurrencyBonus: 3,
  maxStackedXpBonus: 3,
};

const manifest: Pick<CourseManifest, "economy"> = { economy };

const tree: SkillTreeData = {
  rootIds: ["r"],
  nodes: [
    {
      id: "r",
      titleKey: "t",
      descriptionKey: "d",
      parentIds: [],
      cost: 0,
      nodeType: "boost",
      effects: { currencyPerCorrectMult: 0.5 },
      scope: { type: "global" },
    },
  ],
};

describe("computeAwards", () => {
  it("returns null when not correct", () => {
    expect(
      computeAwards(manifest as CourseManifest, tree, new Set(["r"]), { verdict: "close" }, {
        challenge: { id: "c", kind: "word", promptKey: "p", expected: "x", tags: [] },
        module: {
          id: "m",
          titleKey: "t",
          descriptionKey: "d",
          contentKind: "vocabulary_pack",
          levelIds: [],
        },
        comboCount: 0,
        streakDays: 0,
        correctStreakInLevel: 0,
      })
    ).toBeNull();
  });

  it("applies boost multiplier on correct", () => {
    const br = computeAwards(manifest as CourseManifest, tree, new Set(["r"]), { verdict: "correct" }, {
      challenge: { id: "c", kind: "word", promptKey: "p", expected: "x", tags: [] },
      module: {
        id: "m",
        titleKey: "t",
        descriptionKey: "d",
        contentKind: "vocabulary_pack",
        levelIds: [],
      },
      comboCount: 1,
      streakDays: 0,
      correctStreakInLevel: 0,
    });
    expect(br).not.toBeNull();
    expect(br!.currencyMult).toBeCloseTo(1.5, 2);
    expect(br!.currency).toBe(15);
  });
});
