import type { ModuleDef, SkillTreeData } from "./types";

export interface LevelRunSummary {
  levelId: string;
  stars: number;
  accuracy: number;
  completed: boolean;
}

export interface UnlockState {
  userLevel: number;
  purchasedSkillNodeIds: ReadonlySet<string>;
  /** levelId -> summary */
  levelRuns: ReadonlyMap<string, LevelRunSummary>;
}

function moduleLevelsComplete(mod: ModuleDef, state: UnlockState): boolean {
  for (const lid of mod.levelIds) {
    const run = state.levelRuns.get(lid);
    if (!run?.completed) return false;
  }
  return mod.levelIds.length > 0;
}

export function isModuleUnlockedByTree(
  mod: ModuleDef,
  tree: SkillTreeData,
  purchased: ReadonlySet<string>
): boolean {
  const grantSet = new Set<string>();
  for (const id of purchased) {
    const node = tree.nodes.find((n) => n.id === id);
    if (node?.nodeType === "content" && node.grantsModuleIds) {
      for (const m of node.grantsModuleIds) grantSet.add(m);
    }
  }
  return grantSet.has(mod.id);
}

export function evaluateModuleUnlockWithCatalog(
  mod: ModuleDef,
  tree: SkillTreeData,
  state: UnlockState,
  modulesById: ReadonlyMap<string, ModuleDef>
): boolean {
  if (!isModuleUnlockedByTree(mod, tree, state.purchasedSkillNodeIds)) {
    return false;
  }
  const req = mod.unlockRequirements;
  if (!req) return true;
  if (req.requireUserLevel != null && state.userLevel < req.requireUserLevel) {
    return false;
  }
  if (req.requireModuleIdsComplete?.length) {
    for (const mid of req.requireModuleIdsComplete) {
      const m = modulesById.get(mid);
      if (!m || !moduleLevelsComplete(m, state)) return false;
    }
  }
  if (req.requireMinAccuracy != null) {
    for (const lid of mod.levelIds) {
      const run = state.levelRuns.get(lid);
      if (run && run.completed && run.accuracy < req.requireMinAccuracy) {
        return false;
      }
    }
  }
  if (req.requireStars != null) {
    let sum = 0;
    for (const [, run] of state.levelRuns) {
      sum += run.stars;
    }
    if (sum < req.requireStars) return false;
  }
  return true;
}
