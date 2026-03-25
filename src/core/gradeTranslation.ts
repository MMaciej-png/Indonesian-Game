import type { ChallengeDef, GradeResult } from "./types";

const PUNCT_RE = /[.,!?;:'"()[\]{}…-]/g;

export function normalizeAnswer(input: string, options?: { foldDigits?: boolean }): string {
  let s = input.trim().toLowerCase();
  s = s.replace(PUNCT_RE, " ");
  s = s.replace(/\s+/g, " ").trim();
  if (options?.foldDigits) {
    const map: Record<string, string> = {
      "0": "o",
      "1": "i",
      // keep numerals as words already in answers; optional light fold
    };
    s = s
      .split("")
      .map((c) => map[c] ?? c)
      .join("");
  }
  return s;
}

function tokenSortKey(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) row[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[b.length]!;
}

export function similarityRatio(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

export function gradeTranslation(
  userInput: string,
  challenge: ChallengeDef,
  options?: { closeThreshold?: number }
): GradeResult {
  const threshold = challenge.fuzzyThreshold ?? 0.88;
  const closeThreshold = options?.closeThreshold ?? Math.max(0.7, threshold - 0.08);

  const normUser = normalizeAnswer(userInput);
  if (!normUser) {
    return { verdict: "incorrect", ratio: 0 };
  }

  const candidates: string[] = [challenge.expected, ...(challenge.aliases ?? [])].map((c) =>
    normalizeAnswer(c)
  );

  for (const cand of candidates) {
    if (normUser === cand) {
      return { verdict: "correct", matchedAlias: cand, ratio: 1 };
    }
  }

  if (challenge.allowWordOrderVariant) {
    const userKey = tokenSortKey(normUser);
    for (const cand of candidates) {
      if (userKey === tokenSortKey(cand)) {
        return { verdict: "correct", matchedAlias: cand, ratio: 1 };
      }
    }
  }

  let best = 0;
  let bestCand = "";
  for (const cand of candidates) {
    const rOrder = similarityRatio(normUser, cand);
    const rSort = challenge.allowWordOrderVariant
      ? similarityRatio(tokenSortKey(normUser), tokenSortKey(cand))
      : 0;
    const r = Math.max(rOrder, rSort);
    if (r > best) {
      best = r;
      bestCand = cand;
    }
  }

  if (best >= threshold) {
    return { verdict: "correct", matchedAlias: bestCand, ratio: best };
  }
  if (best >= closeThreshold) {
    return { verdict: "close", matchedAlias: bestCand, ratio: best };
  }
  return { verdict: "incorrect", ratio: best };
}
