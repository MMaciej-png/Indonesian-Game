import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validateGachaPool } from "../src/core/gacha";
import type {
  ChallengeDef,
  CosmeticsCatalog,
  CourseManifest,
  GachaPool,
  ModuleDef,
  SkillTreeData,
} from "../src/core/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EN_ID = join(ROOT, "content", "en_id");

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function collectKeys(obj: unknown, out: Set<string>): void {
  if (obj === null || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    for (const x of obj) collectKeys(x, out);
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k.endsWith("Key") && typeof v === "string") {
      out.add(v);
    }
    collectKeys(v, out);
  }
}

function main(): void {
  const errors: string[] = [];

  const coursePath = join(EN_ID, "course.json");
  if (!existsSync(coursePath)) {
    console.error("Missing course.json");
    process.exit(1);
  }
  const course = readJson<CourseManifest>(coursePath);

  const stringsPath = join(EN_ID, "strings", "en.json");
  if (!existsSync(stringsPath)) {
    errors.push("Missing strings/en.json");
  }
  const strings = existsSync(stringsPath)
    ? (readJson<Record<string, string>>(stringsPath) as Record<string, string>)
    : {};

  const skillTreePath = join(EN_ID, course.skillTreePath);
  const tree = readJson<SkillTreeData>(skillTreePath);

  const nodeIds = new Set<string>();
  for (const n of tree.nodes) {
    if (nodeIds.has(n.id)) errors.push(`duplicate skill node id: ${n.id}`);
    nodeIds.add(n.id);
  }
  for (const n of tree.nodes) {
    for (const p of n.parentIds) {
      if (!nodeIds.has(p)) errors.push(`parent ${p} of ${n.id} not found in nodes`);
    }
  }
  for (const rid of tree.rootIds) {
    if (!nodeIds.has(rid)) errors.push(`rootId ${rid} not in nodes`);
  }

  const adj = new Map<string, string[]>();
  for (const n of tree.nodes) {
    for (const p of n.parentIds) {
      if (!adj.has(p)) adj.set(p, []);
      adj.get(p)!.push(n.id);
    }
  }
  const reachable = new Set<string>();
  const stack = [...tree.rootIds];
  while (stack.length) {
    const id = stack.pop()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    for (const c of adj.get(id) ?? []) stack.push(c);
  }
  for (const n of tree.nodes) {
    if (!reachable.has(n.id)) errors.push(`node ${n.id} not reachable from roots`);
  }

  const modMap = new Map<string, ModuleDef>();
  for (const mid of course.moduleIds) {
    const p = join(EN_ID, "modules", `${mid}.json`);
    if (!existsSync(p)) errors.push(`missing module file modules/${mid}.json`);
    else {
      const m = readJson<ModuleDef>(p);
      if (m.id !== mid) errors.push(`module id mismatch ${m.id} vs ${mid}`);
      modMap.set(m.id, m);
    }
  }

  const levelFiles = readdirSync(join(EN_ID, "levels")).filter((f) => f.endsWith(".json"));
  const levelById = new Map<
    string,
    { level: { id: string; challengeIds: string[] }; challenges: ChallengeDef[] }
  >();
  for (const f of levelFiles) {
    const data = readJson<{
      level: { id: string; challengeIds: string[] };
      challenges: ChallengeDef[];
    }>(join(EN_ID, "levels", f));
    if (levelById.has(data.level.id)) errors.push(`duplicate level id ${data.level.id}`);
    levelById.set(data.level.id, data);
    const cids = new Set(data.challenges.map((c) => c.id));
    for (const cid of data.level.challengeIds) {
      if (!cids.has(cid)) errors.push(`level ${data.level.id} lists missing challenge ${cid}`);
    }
    for (const c of data.challenges) {
      if (!data.level.challengeIds.includes(c.id)) {
        errors.push(`orphan challenge ${c.id} in ${f}`);
      }
    }
  }

  for (const m of modMap.values()) {
    for (const lid of m.levelIds) {
      if (!levelById.has(lid)) errors.push(`module ${m.id} references unknown level ${lid}`);
    }
    if (m.unlockRequirements?.requireModuleIdsComplete) {
      for (const mid of m.unlockRequirements.requireModuleIdsComplete) {
        if (!modMap.has(mid)) errors.push(`module ${m.id} requires unknown module ${mid}`);
      }
    }
  }

  for (const n of tree.nodes) {
    if (n.nodeType === "content" && n.grantsModuleIds) {
      for (const mid of n.grantsModuleIds) {
        if (!course.moduleIds.includes(mid)) {
          errors.push(`node ${n.id} grants unknown module ${mid}`);
        }
      }
    }
  }

  const catalogPath = join(EN_ID, course.cosmeticsCatalogPath);
  const poolPath = join(EN_ID, course.gachaPoolPath);
  if (!existsSync(catalogPath)) errors.push("missing cosmetics catalog");
  if (!existsSync(poolPath)) errors.push("missing gacha pool");
  if (existsSync(catalogPath) && existsSync(poolPath)) {
    const catalog = readJson<CosmeticsCatalog>(catalogPath);
    const pool = readJson<GachaPool>(poolPath);
    errors.push(...validateGachaPool(pool, catalog));
  }

  const keyUse = new Set<string>();
  collectKeys(readJson(join(EN_ID, "course.json")), keyUse);
  collectKeys(tree, keyUse);
  for (const f of levelFiles) {
    collectKeys(readJson(join(EN_ID, "levels", f)), keyUse);
  }
  for (const mid of course.moduleIds) {
    const p = join(EN_ID, "modules", `${mid}.json`);
    if (existsSync(p)) collectKeys(readJson(p), keyUse);
  }
  if (existsSync(catalogPath)) collectKeys(readJson(catalogPath), keyUse);
  if (existsSync(poolPath)) collectKeys(readJson(poolPath), keyUse);

  for (const k of keyUse) {
    if (!(k in strings)) errors.push(`missing string key: ${k}`);
  }

  if (course.stars.twoStarMinAccuracy >= course.stars.threeStarMinAccuracy) {
    errors.push("stars: twoStarMinAccuracy must be < threeStarMinAccuracy");
  }

  if (errors.length) {
    console.error("Content validation failed:");
    for (const e of errors) console.error(" -", e);
    process.exit(1);
  }
  console.log("content/en_id: OK");
}

main();
