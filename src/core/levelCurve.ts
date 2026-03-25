/** XP thresholds to reach the *next* level (cumulative XP handled by caller). */

export function xpToReachLevel(targetLevel: number): number {
  if (targetLevel <= 1) return 0;
  // gentle curve: 50 * n^1.4
  let total = 0;
  for (let L = 2; L <= targetLevel; L++) {
    total += Math.floor(50 * Math.pow(L, 1.4));
  }
  return total;
}

export function levelFromTotalXp(totalXp: number): number {
  let level = 1;
  while (xpToReachLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

export function rankTitleForLevel(level: number): string {
  if (level < 3) return "Pemula";
  if (level < 6) return "Penjelajah";
  if (level < 10) return "Pelajar";
  if (level < 15) return "Penutur";
  if (level < 20) return "Ahli pidato";
  return "Legenda Jakarta";
}
