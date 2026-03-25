import type {
  ChallengeDef,
  CourseManifest,
  CosmeticsCatalog,
  GachaPool,
  LevelDef,
  ModuleDef,
  SkillTreeData,
} from "../core/types";
import courseJson from "@content/en_id/course.json";
import skillTreeJson from "@content/en_id/skill-tree.json";
import catalogJson from "@content/en_id/cosmetics/catalog.json";
import poolJson from "@content/en_id/cosmetics/pool.json";
import modGreetings from "@content/en_id/modules/greetings.json";
import modNumbers from "@content/en_id/modules/numbers_casual.json";
import modDaily from "@content/en_id/modules/daily_chat.json";
import modParticles from "@content/en_id/modules/particles_nih.json";
import levG1 from "@content/en_id/levels/greetings_L1.json";
import levG2 from "@content/en_id/levels/greetings_L2.json";
import levN1 from "@content/en_id/levels/numbers_L1.json";
import levD1 from "@content/en_id/levels/daily_L1.json";
import levP1 from "@content/en_id/levels/particles_L1.json";
import stringsEn from "@content/en_id/strings/en.json";

export interface LevelBundle {
  level: LevelDef;
  challenges: ChallengeDef[];
}

export interface LoadedPack {
  manifest: CourseManifest;
  skillTree: SkillTreeData;
  cosmetics: CosmeticsCatalog;
  gachaPool: GachaPool;
  modules: ModuleDef[];
  modulesById: Map<string, ModuleDef>;
  levelById: Map<string, LevelBundle>;
  challengeById: Map<string, ChallengeDef>;
  strings: Record<string, string>;
}

const levelFiles: LevelBundle[] = [
  levG1 as LevelBundle,
  levG2 as LevelBundle,
  levN1 as LevelBundle,
  levD1 as LevelBundle,
  levP1 as LevelBundle,
];

const moduleFiles: ModuleDef[] = [
  modGreetings as ModuleDef,
  modNumbers as ModuleDef,
  modDaily as ModuleDef,
  modParticles as ModuleDef,
];

export function loadEnIdPack(): LoadedPack {
  const manifest = courseJson as CourseManifest;
  const skillTree = skillTreeJson as SkillTreeData;
  const cosmetics = catalogJson as CosmeticsCatalog;
  const gachaPool = poolJson as GachaPool;
  const strings = stringsEn as Record<string, string>;

  const levelById = new Map<string, LevelBundle>();
  const challengeById = new Map<string, ChallengeDef>();
  for (const b of levelFiles) {
    levelById.set(b.level.id, b);
    for (const c of b.challenges) challengeById.set(c.id, c);
  }

  const modulesById = new Map<string, ModuleDef>();
  for (const m of moduleFiles) modulesById.set(m.id, m);

  return {
    manifest,
    skillTree,
    cosmetics,
    gachaPool,
    modules: moduleFiles,
    modulesById,
    levelById,
    challengeById,
    strings,
  };
}

export function resolveKey(strings: Record<string, string>, key: string, vars?: Record<string, string | number>): string {
  let s = strings[key] ?? key;
  if (vars) {
    for (const [vk, vv] of Object.entries(vars)) {
      s = s.replaceAll(`{${vk}}`, String(vv));
    }
  }
  return s;
}
