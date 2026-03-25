import Database from "@tauri-apps/plugin-sql";

export interface Profile {
  currency: number;
  xp: number;
  userLevel: number;
  shards: number;
  streak: number;
  lastStreakYmd: string | null;
}

type Mem = {
  profile: Profile;
  purchased: Set<string>;
  levelRuns: Map<string, { stars: number; accuracy: number; completed: number }>;
  ownedCosmetics: Set<string>;
  equipped: Record<string, string>;
  gachaPity: Map<string, { pullsSince: number }>;
  settings: Map<string, string>;
};

let memInstance: Mem | null = null;

let db: Database | null = null;
let useMemory = false;

const DEFAULT_PROFILE: Profile = {
  currency: 0,
  xp: 0,
  userLevel: 1,
  shards: 0,
  streak: 0,
  lastStreakYmd: null,
};

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function computeStreakUpdate(p: Profile): Profile {
  const t = todayYmd();
  if (p.lastStreakYmd === t) return p;
  if (!p.lastStreakYmd) {
    return { ...p, streak: 1, lastStreakYmd: t };
  }
  const prev = new Date(p.lastStreakYmd + "T12:00:00");
  const diff = (Date.now() - prev.getTime()) / 86400000;
  if (diff >= 1 && diff < 2) {
    return { ...p, streak: p.streak + 1, lastStreakYmd: t };
  }
  if (diff < 1) return p;
  return { ...p, streak: 1, lastStreakYmd: t };
}

export async function recordDailyStreakIfNeeded(): Promise<Profile> {
  const p = await getProfile();
  const n = computeStreakUpdate(p);
  if (n.streak === p.streak && n.lastStreakYmd === p.lastStreakYmd) return p;
  await saveProfile(n);
  return n;
}

export async function initDb(): Promise<void> {
  try {
    const d = await Database.load("sqlite:indo.db");
    db = d;
    await d.execute(`
      CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        currency INTEGER NOT NULL DEFAULT 0,
        xp INTEGER NOT NULL DEFAULT 0,
        user_level INTEGER NOT NULL DEFAULT 1,
        shards INTEGER NOT NULL DEFAULT 0,
        streak INTEGER NOT NULL DEFAULT 0,
        last_streak_ymd TEXT
      );
    `);
    await d.execute(`
      CREATE TABLE IF NOT EXISTS purchased_skill_nodes (
        node_id TEXT PRIMARY KEY
      );
    `);
    await d.execute(`
      CREATE TABLE IF NOT EXISTS level_runs (
        level_id TEXT PRIMARY KEY,
        stars INTEGER NOT NULL DEFAULT 0,
        accuracy REAL NOT NULL DEFAULT 0,
        completed INTEGER NOT NULL DEFAULT 0
      );
    `);
    await d.execute(`
      CREATE TABLE IF NOT EXISTS owned_cosmetics (
        cosmetic_id TEXT PRIMARY KEY
      );
    `);
    await d.execute(`
      CREATE TABLE IF NOT EXISTS equipped_cosmetics (
        slot TEXT PRIMARY KEY,
        cosmetic_id TEXT
      );
    `);
    await d.execute(`
      CREATE TABLE IF NOT EXISTS gacha_pity (
        pool_id TEXT PRIMARY KEY,
        pulls_since INTEGER NOT NULL DEFAULT 0,
        hard_pity INTEGER NOT NULL DEFAULT 0
      );
    `);
    await d.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    const rows = await d.select<{ c: number }[]>("SELECT COUNT(*) as c FROM profile WHERE id = 1");
    if (rows[0]?.c === 0) {
      await d.execute(
        "INSERT INTO profile (id, currency, xp, user_level, shards, streak) VALUES (1, 0, 0, 1, 0, 0)"
      );
    }
    useMemory = false;
  } catch {
    useMemory = true;
    db = null;
    memInstance = {
      profile: { ...DEFAULT_PROFILE },
      purchased: new Set(),
      levelRuns: new Map(),
      ownedCosmetics: new Set(),
      equipped: {},
      gachaPity: new Map(),
      settings: new Map(),
    };
  }
}

export async function getProfile(): Promise<Profile> {
  if (useMemory && memInstance) {
    return { ...memInstance.profile };
  }
  if (!db) throw new Error("DB not initialized");
  const rows = await db.select<{
    currency: number;
    xp: number;
    user_level: number;
    shards: number;
    streak: number;
    last_streak_ymd: string | null;
  }[]>("SELECT currency, xp, user_level, shards, streak, last_streak_ymd FROM profile WHERE id = 1");
  const r = rows[0]!;
  return {
    currency: r.currency,
    xp: r.xp,
    userLevel: r.user_level,
    shards: r.shards,
    streak: r.streak,
    lastStreakYmd: r.last_streak_ymd,
  };
}

export async function saveProfile(p: Profile): Promise<void> {
  if (useMemory && memInstance) {
    memInstance.profile = { ...p };
    return;
  }
  if (!db) throw new Error("DB not initialized");
  await db.execute(
    "UPDATE profile SET currency = ?, xp = ?, user_level = ?, shards = ?, streak = ?, last_streak_ymd = ? WHERE id = 1",
    [p.currency, p.xp, p.userLevel, p.shards, p.streak, p.lastStreakYmd]
  );
}

export async function getPurchasedNodes(): Promise<Set<string>> {
  if (useMemory && memInstance) {
    return new Set(memInstance.purchased);
  }
  if (!db) throw new Error("DB not initialized");
  const rows = await db.select<{ node_id: string }[]>("SELECT node_id FROM purchased_skill_nodes");
  return new Set(rows.map((r) => r.node_id));
}

export async function addPurchasedNode(nodeId: string): Promise<void> {
  if (useMemory && memInstance) {
    memInstance.purchased.add(nodeId);
    return;
  }
  if (!db) throw new Error("DB not initialized");
  await db.execute("INSERT OR IGNORE INTO purchased_skill_nodes (node_id) VALUES (?)", [nodeId]);
}

export async function seedZeroCostPurchases(nodes: { id: string; cost: number }[]): Promise<void> {
  const cur = await getPurchasedNodes();
  if (cur.size > 0) return;
  for (const n of nodes) {
    if (n.cost === 0) await addPurchasedNode(n.id);
  }
}

export async function getAllLevelRuns(): Promise<
  Map<string, { stars: number; accuracy: number; completed: boolean }>
> {
  if (useMemory && memInstance) {
    const m = new Map<string, { stars: number; accuracy: number; completed: boolean }>();
    for (const [lid, r] of memInstance.levelRuns) {
      m.set(lid, { stars: r.stars, accuracy: r.accuracy, completed: r.completed === 1 });
    }
    return m;
  }
  if (!db) throw new Error("DB not initialized");
  const rows = await db.select<{ level_id: string; stars: number; accuracy: number; completed: number }[]>(
    "SELECT level_id, stars, accuracy, completed FROM level_runs"
  );
  const m = new Map<string, { stars: number; accuracy: number; completed: boolean }>();
  for (const r of rows) {
    m.set(r.level_id, { stars: r.stars, accuracy: r.accuracy, completed: r.completed === 1 });
  }
  return m;
}

export async function getLevelRun(
  levelId: string
): Promise<{ stars: number; accuracy: number; completed: boolean } | null> {
  if (useMemory && memInstance) {
    const r = memInstance.levelRuns.get(levelId);
    if (!r) return null;
    return { stars: r.stars, accuracy: r.accuracy, completed: r.completed === 1 };
  }
  if (!db) throw new Error("DB not initialized");
  const rows = await db.select<{ stars: number; accuracy: number; completed: number }[]>(
    "SELECT stars, accuracy, completed FROM level_runs WHERE level_id = ?",
    [levelId]
  );
  const r = rows[0];
  if (!r) return null;
  return { stars: r.stars, accuracy: r.accuracy, completed: r.completed === 1 };
}

export async function saveLevelRun(levelId: string, stars: number, accuracy: number): Promise<void> {
  const prev = await getLevelRun(levelId);
  const nextStars = Math.max(prev?.stars ?? 0, stars);
  if (useMemory && memInstance) {
    memInstance.levelRuns.set(levelId, { stars: nextStars, accuracy, completed: 1 });
    return;
  }
  if (!db) throw new Error("DB not initialized");
  await db.execute(
    `INSERT INTO level_runs (level_id, stars, accuracy, completed) VALUES (?, ?, ?, 1)
     ON CONFLICT(level_id) DO UPDATE SET
       stars = MAX(stars, excluded.stars),
       accuracy = excluded.accuracy,
       completed = 1`,
    [levelId, stars, accuracy]
  );
}

export async function getOwnedCosmetics(): Promise<Set<string>> {
  if (useMemory && memInstance) return new Set(memInstance.ownedCosmetics);
  if (!db) throw new Error("DB not initialized");
  const rows = await db.select<{ cosmetic_id: string }[]>("SELECT cosmetic_id FROM owned_cosmetics");
  return new Set(rows.map((r) => r.cosmetic_id));
}

export async function addOwnedCosmetic(id: string): Promise<void> {
  if (useMemory && memInstance) {
    memInstance.ownedCosmetics.add(id);
    return;
  }
  if (!db) throw new Error("DB not initialized");
  await db.execute("INSERT OR IGNORE INTO owned_cosmetics (cosmetic_id) VALUES (?)", [id]);
}

export async function getEquipped(): Promise<Record<string, string>> {
  if (useMemory && memInstance) return { ...memInstance.equipped };
  if (!db) throw new Error("DB not initialized");
  const rows = await db.select<{ slot: string; cosmetic_id: string | null }[]>(
    "SELECT slot, cosmetic_id FROM equipped_cosmetics"
  );
  const out: Record<string, string> = {};
  for (const r of rows) {
    if (r.cosmetic_id) out[r.slot] = r.cosmetic_id;
  }
  return out;
}

export async function setEquippedSlot(slot: string, cosmeticId: string | null): Promise<void> {
  if (useMemory && memInstance) {
    if (cosmeticId) memInstance.equipped[slot] = cosmeticId;
    else delete memInstance.equipped[slot];
    return;
  }
  if (!db) throw new Error("DB not initialized");
  if (cosmeticId) {
    await db.execute(
      "INSERT INTO equipped_cosmetics (slot, cosmetic_id) VALUES (?, ?) ON CONFLICT(slot) DO UPDATE SET cosmetic_id = excluded.cosmetic_id",
      [slot, cosmeticId]
    );
  } else {
    await db.execute("DELETE FROM equipped_cosmetics WHERE slot = ?", [slot]);
  }
}

export async function getGachaPity(poolId: string): Promise<number> {
  if (useMemory && memInstance) {
    return memInstance.gachaPity.get(poolId)?.pullsSince ?? 0;
  }
  if (!db) throw new Error("DB not initialized");
  const rows = await db.select<{ pulls_since: number }[]>(
    "SELECT pulls_since FROM gacha_pity WHERE pool_id = ?",
    [poolId]
  );
  return rows[0]?.pulls_since ?? 0;
}

export async function setGachaPity(poolId: string, pullsSince: number): Promise<void> {
  if (useMemory && memInstance) {
    memInstance.gachaPity.set(poolId, { pullsSince });
    return;
  }
  if (!db) throw new Error("DB not initialized");
  await db.execute(
    "INSERT INTO gacha_pity (pool_id, pulls_since, hard_pity) VALUES (?, ?, 0) ON CONFLICT(pool_id) DO UPDATE SET pulls_since = excluded.pulls_since",
    [poolId, pullsSince]
  );
}

export async function resetAllProgress(): Promise<void> {
  if (useMemory && memInstance) {
    memInstance.profile = { ...DEFAULT_PROFILE };
    memInstance.purchased.clear();
    memInstance.levelRuns.clear();
    memInstance.ownedCosmetics.clear();
    memInstance.equipped = {};
    memInstance.gachaPity.clear();
    return;
  }
  if (!db) throw new Error("DB not initialized");
  await db.execute("UPDATE profile SET currency = 0, xp = 0, user_level = 1, shards = 0, streak = 0, last_streak_ymd = NULL WHERE id = 1");
  await db.execute("DELETE FROM purchased_skill_nodes");
  await db.execute("DELETE FROM level_runs");
  await db.execute("DELETE FROM owned_cosmetics");
  await db.execute("DELETE FROM equipped_cosmetics");
  await db.execute("DELETE FROM gacha_pity");
}

export function isMemoryPersistence(): boolean {
  return useMemory;
}
