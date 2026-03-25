import type {
  BoostEffects,
  BoostScope,
  ContentKind,
  CourseEconomy,
  SkillTreeData,
  SkillTreeNode,
} from "./types";

function scopeApplies(scope: BoostScope | undefined, ctx: BoostMatchContext): boolean {
  if (!scope || scope.type === "global") return true;
  if (scope.type === "tag") {
    return ctx.tags.includes(scope.tag);
  }
  if (scope.type === "contentKind") {
    return ctx.contentKind === scope.contentKind;
  }
  return false;
}

export interface BoostMatchContext {
  tags: string[];
  contentKind: ContentKind;
}

export function aggregateBoostMultipliers(
  tree: SkillTreeData,
  purchasedNodeIds: ReadonlySet<string>,
  ctx: BoostMatchContext,
  caps: Pick<CourseEconomy, "maxStackedCurrencyBonus" | "maxStackedXpBonus">
): { currencyMult: number; xpMult: number; comboCapAdd: number; streakMult: number } {
  let currencyAdd = 0;
  let xpAdd = 0;
  let comboCapAdd = 0;
  let streakAdd = 0;

  const byId = new Map<string, SkillTreeNode>();
  for (const n of tree.nodes) byId.set(n.id, n);

  for (const id of purchasedNodeIds) {
    const node = byId.get(id);
    if (!node || node.nodeType !== "boost" || !node.effects) continue;
    if (!scopeApplies(node.scope, ctx)) continue;
    const e: BoostEffects = node.effects;
    currencyAdd += e.currencyPerCorrectMult ?? 0;
    xpAdd += e.xpPerCorrectMult ?? 0;
    comboCapAdd += e.comboMaxCapAdd ?? 0;
    streakAdd += e.streakBonusMult ?? 0;
  }

  const currencyMult = Math.min(caps.maxStackedCurrencyBonus, 1 + currencyAdd);
  const xpMult = Math.min(caps.maxStackedXpBonus, 1 + xpAdd);
  const streakMult = 1 + streakAdd;
  return { currencyMult, xpMult, comboCapAdd, streakMult };
}
