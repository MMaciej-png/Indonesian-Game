import { describe, expect, it } from "vitest";
import { applyPurchase, canPurchaseNode } from "../skillTreePurchase";
import type { SkillTreeData } from "../types";

const tree: SkillTreeData = {
  rootIds: ["a"],
  nodes: [
    {
      id: "a",
      titleKey: "t",
      descriptionKey: "d",
      parentIds: [],
      cost: 0,
      nodeType: "content",
      grantsModuleIds: ["m1"],
    },
    {
      id: "b",
      titleKey: "t",
      descriptionKey: "d",
      parentIds: ["a"],
      cost: 50,
      nodeType: "boost",
      effects: { xpPerCorrectMult: 0.1 },
    },
  ],
};

describe("canPurchaseNode", () => {
  it("requires parents", () => {
    expect(canPurchaseNode(tree, new Set(), "b", 100).ok).toBe(false);
    expect(canPurchaseNode(tree, new Set(["a"]), "b", 100).ok).toBe(true);
  });

  it("requires currency", () => {
    expect(canPurchaseNode(tree, new Set(["a"]), "b", 10).ok).toBe(false);
  });
});

describe("applyPurchase", () => {
  it("deducts cost", () => {
    const { currency, result } = applyPurchase(tree, new Set(["a"]), "b", 100);
    expect(result.ok).toBe(true);
    expect(currency).toBe(50);
  });
});
