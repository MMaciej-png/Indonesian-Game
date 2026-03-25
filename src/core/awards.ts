import { aggregateBoostMultipliers } from "./boosts";
import type {
  AwardBreakdown,
  AwardContext,
  CourseEconomy,
  GradeResult,
  SkillTreeData,
} from "./types";

export function comboBonusPercent(
  economy: CourseEconomy,
  comboCount: number,
  comboCapAdd: number
): number {
  const rawSteps = Math.max(0, comboCount - 1);
  const per = economy.comboBonusPercentPerStep;
  const max = economy.maxComboBonusPercent + comboCapAdd * per;
  return Math.min(max, rawSteps * per);
}

export function computeAwards(
  manifest: { economy: CourseEconomy },
  skillTree: SkillTreeData,
  purchasedNodeIds: ReadonlySet<string>,
  grade: GradeResult,
  ctx: AwardContext
): AwardBreakdown | null {
  if (grade.verdict !== "correct") return null;

  const { currencyMult, xpMult, comboCapAdd, streakMult } = aggregateBoostMultipliers(
    skillTree,
    purchasedNodeIds,
    { tags: ctx.challenge.tags ?? [], contentKind: ctx.module.contentKind },
    manifest.economy
  );

  const comboPct = comboBonusPercent(manifest.economy, ctx.comboCount, comboCapAdd);
  const comboFactor = 1 + comboPct / 100;
  const streakFactor = ctx.streakDays > 0 ? streakMult : 1;

  const currencyBase = manifest.economy.baseCurrencyPerCorrect * comboFactor * streakFactor;
  const xpBase =
    manifest.economy.baseXpPerCorrect * (ctx.levelXpMultiplier ?? 1) * comboFactor * streakFactor;

  const currency = Math.floor(currencyBase * currencyMult);
  const xp = Math.floor(xpBase * xpMult);

  return {
    currency,
    xp,
    currencyBase: manifest.economy.baseCurrencyPerCorrect,
    xpBase: manifest.economy.baseXpPerCorrect,
    currencyMult,
    xpMult,
    comboBonusPercent: comboPct,
  };
}
