export type ContentKind =
  | "vocabulary_pack"
  | "sentence_patterns"
  | "morphology_affixes"
  | "mixed";

export type ChallengeKind = "word" | "sentence" | "affix";

export type BoostScope =
  | { type: "global" }
  | { type: "tag"; tag: string }
  | { type: "contentKind"; contentKind: ContentKind };

export type SkillNodeType = "boost" | "content";

export interface BoostEffects {
  currencyPerCorrectMult?: number;
  xpPerCorrectMult?: number;
  comboMaxCapAdd?: number;
  streakBonusMult?: number;
}

export interface SkillTreeNode {
  id: string;
  titleKey: string;
  descriptionKey: string;
  parentIds: string[];
  cost: number;
  branch?: string;
  branchStyleKey?: string;
  nodeType: SkillNodeType;
  effects?: BoostEffects;
  scope?: BoostScope;
  grantsModuleIds?: string[];
  unlockFeatureFlags?: string[];
}

export interface SkillTreeData {
  rootIds: string[];
  nodes: SkillTreeNode[];
}

export interface CourseEconomy {
  baseCurrencyPerCorrect: number;
  baseXpPerCorrect: number;
  comboBonusPercentPerStep: number;
  maxComboBonusPercent: number;
  currencyNameKey: string;
  maxStackedCurrencyBonus: number;
  maxStackedXpBonus: number;
}

export interface StarsRule {
  twoStarMinAccuracy: number;
  threeStarMinAccuracy: number;
}

export interface CourseManifest {
  id: string;
  sourceLocale: string;
  targetLocale: string;
  targetRegister: string;
  version: string;
  skillTreePath: string;
  cosmeticsCatalogPath: string;
  gachaPoolPath: string;
  moduleIds: string[];
  economy: CourseEconomy;
  stars: StarsRule;
}

export interface ModuleUnlockRequirements {
  requireModuleIdsComplete?: string[];
  requireMinAccuracy?: number;
  requireUserLevel?: number;
  requireStars?: number;
}

export interface ModuleDef {
  id: string;
  titleKey: string;
  descriptionKey: string;
  contentKind: ContentKind;
  unlockRequirements?: ModuleUnlockRequirements;
  levelIds: string[];
  tier?: number;
  sortOrder?: number;
}

export interface LevelDef {
  id: string;
  titleKey: string;
  challengeIds: string[];
  xpMultiplier?: number;
  sentenceFeatureKey?: string;
}

export interface ChallengeDef {
  id: string;
  kind: ChallengeKind;
  promptKey: string;
  hintKey?: string;
  registerNoteKey?: string;
  expected: string;
  aliases?: string[];
  fuzzyThreshold?: number;
  allowWordOrderVariant?: boolean;
  tags?: string[];
  morph?: {
    affix: string;
    slot: "prefix" | "suffix";
    glossKey?: string;
  };
}

export type CosmeticRarity = "common" | "uncommon" | "rare" | "epic";

export type CosmeticSlot = "hat" | "clothes" | "shoes" | "background";

export interface CosmeticItem {
  id: string;
  nameKey: string;
  slot: CosmeticSlot;
  rarity: CosmeticRarity;
  /** Display hint for UI (not shown to learner as curriculum) */
  paletteKey?: string;
}

export interface CosmeticsCatalog {
  items: CosmeticItem[];
}

export interface GachaPoolEntry {
  cosmeticId: string;
  weight: number;
}

export interface GachaPityConfig {
  /** Pulls without rare+ before pity boosts (MVP: track in core only) */
  softPityStart?: number;
  /** Guaranteed rare or higher every N pulls */
  hardPityEvery?: number;
  /** rarity considered "rare+" for pity */
  rarePlusRarity?: CosmeticRarity;
}

export interface GachaPool {
  id: string;
  nameKey: string;
  pullCost: number;
  entries: GachaPoolEntry[];
  pity?: GachaPityConfig;
  duplicateShardReward: number;
}

export interface GradeResult {
  verdict: "correct" | "close" | "incorrect";
  matchedAlias?: string;
  ratio?: number;
}

export interface AwardContext {
  challenge: ChallengeDef;
  module: ModuleDef;
  comboCount: number;
  streakDays: number;
  correctStreakInLevel: number;
  levelXpMultiplier?: number;
}

export interface AwardBreakdown {
  currency: number;
  xp: number;
  currencyBase: number;
  xpBase: number;
  currencyMult: number;
  xpMult: number;
  comboBonusPercent: number;
}
