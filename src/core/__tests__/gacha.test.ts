import { describe, expect, it } from "vitest";
import { rollGacha, validateGachaPool } from "../gacha";
import type { CosmeticsCatalog, GachaPool } from "../types";

const catalog: CosmeticsCatalog = {
  items: [
    { id: "a", nameKey: "k.a", slot: "hat", rarity: "common" },
    { id: "b", nameKey: "k.b", slot: "hat", rarity: "rare" },
  ],
};

const pool: GachaPool = {
  id: "p",
  nameKey: "k.p",
  pullCost: 10,
  duplicateShardReward: 5,
  entries: [
    { cosmeticId: "a", weight: 1 },
    { cosmeticId: "b", weight: 1 },
  ],
  pity: { hardPityEvery: 3, rarePlusRarity: "rare" },
};

describe("validateGachaPool", () => {
  it("passes valid pool", () => {
    expect(validateGachaPool(pool, catalog)).toEqual([]);
  });

  it("errors on unknown id", () => {
    const bad = { ...pool, entries: [{ cosmeticId: "x", weight: 1 }] };
    expect(validateGachaPool(bad, catalog).length).toBeGreaterThan(0);
  });
});

describe("rollGacha", () => {
  it("returns a catalog item", () => {
    const rng = () => 0.1;
    const r = rollGacha({
      pool,
      catalog,
      ownedCosmeticIds: new Set(),
      pityPullsSinceRarePlus: 0,
      rng,
    });
    expect(catalog.items.some((i) => i.id === r.cosmetic.id)).toBe(true);
  });

  it("marks duplicate", () => {
    const r = rollGacha({
      pool,
      catalog,
      ownedCosmeticIds: new Set(["a"]),
      pityPullsSinceRarePlus: 0,
      rng: () => 0,
    });
    expect(r.isDuplicate).toBe(true);
    expect(r.shards).toBe(pool.duplicateShardReward);
  });
});
