import type { CosmeticItem, CosmeticRarity, CosmeticsCatalog, GachaPool } from "./types";

const RARITY_RANK: Record<CosmeticRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
};

export interface GachaRollInput {
  pool: GachaPool;
  catalog: CosmeticsCatalog;
  ownedCosmeticIds: ReadonlySet<string>;
  pityPullsSinceRarePlus: number;
  rng: () => number;
}

export interface GachaRollResult {
  cosmetic: CosmeticItem;
  isDuplicate: boolean;
  shards: number;
  /** Updated pity counter (pulls since rare+) */
  nextPityPullsSinceRarePlus: number;
}

function pickWeighted(entries: { cosmeticId: string; weight: number }[], rng: () => number): string {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let r = rng() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r <= 0) return e.cosmeticId;
  }
  return entries[entries.length - 1]!.cosmeticId;
}

function isRarePlus(item: CosmeticItem, threshold: CosmeticRarity): boolean {
  return RARITY_RANK[item.rarity] >= RARITY_RANK[threshold];
}

export function rollGacha(input: GachaRollInput): GachaRollResult {
  const byId = new Map(input.catalog.items.map((i) => [i.id, i]));
  const pity = input.pool.pity;
  const rarePlus: CosmeticRarity = pity?.rarePlusRarity ?? "rare";

  let weights = input.pool.entries.map((e) => ({ ...e }));
  const hardEvery = pity?.hardPityEvery;
  if (hardEvery && input.pityPullsSinceRarePlus >= hardEvery - 1) {
    weights = weights.filter((e) => {
      const it = byId.get(e.cosmeticId);
      return it && isRarePlus(it, rarePlus);
    });
    if (weights.length === 0) weights = [...input.pool.entries];
  }

  const pickedId = pickWeighted(weights, input.rng);
  const cosmetic = byId.get(pickedId);
  if (!cosmetic) {
    throw new Error(`Gacha pool references unknown cosmetic: ${pickedId}`);
  }

  const isDup = input.ownedCosmeticIds.has(cosmetic.id);
  const shards = isDup ? input.pool.duplicateShardReward : 0;

  let nextPity = input.pityPullsSinceRarePlus + 1;
  if (isRarePlus(cosmetic, rarePlus)) {
    nextPity = 0;
  }

  return {
    cosmetic,
    isDuplicate: isDup,
    shards,
    nextPityPullsSinceRarePlus: nextPity,
  };
}

export function validateGachaPool(pool: GachaPool, catalog: CosmeticsCatalog): string[] {
  const errors: string[] = [];
  const ids = new Set(catalog.items.map((i) => i.id));
  if (pool.pullCost < 0) errors.push("pullCost must be >= 0");
  let sum = 0;
  for (const e of pool.entries) {
    if (e.weight <= 0) errors.push(`weight must be > 0 for ${e.cosmeticId}`);
    if (!ids.has(e.cosmeticId)) errors.push(`unknown cosmetic in pool: ${e.cosmeticId}`);
    sum += e.weight;
  }
  if (sum <= 0) errors.push("pool total weight must be > 0");
  return errors;
}
