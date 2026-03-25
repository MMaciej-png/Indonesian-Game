import { useCallback, useEffect, useState } from "react";
import { computeAwards, gradeTranslation, levelFromTotalXp, rankTitleForLevel } from "../core";
import type { LoadedPack } from "../services/contentLoader";
import { resolveKey } from "../services/contentLoader";
import type { Profile } from "../services/db";
import { getProfile, recordDailyStreakIfNeeded, saveLevelRun, saveProfile } from "../services/db";

export function LevelScreen(props: {
  pack: LoadedPack;
  profile: Profile;
  purchased: Set<string>;
  moduleId: string;
  levelId: string;
  reducedMotion: boolean;
  onBack: () => void;
  onDone: () => void;
}) {
  const { pack, profile, purchased, moduleId, levelId, reducedMotion, onBack, onDone } = props;
  const t = (k: string, vars?: Record<string, string | number>) => resolveKey(pack.strings, k, vars);
  const mod = pack.modulesById.get(moduleId);
  const bundle = pack.levelById.get(levelId);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [combo, setCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [toast, setToast] = useState<{ kind: "xp" | "cur"; n: number } | null>(null);
  const [finished, setFinished] = useState<null | { acc: number; stars: number }>(null);
  const challenges = bundle?.challenges ?? [];
  const total = challenges.length;
  const challenge = challenges[idx];

  const pushToast = useCallback(
    (kind: "xp" | "cur", n: number) => {
      setToast({ kind, n });
      if (!reducedMotion) {
        setTimeout(() => setToast(null), 900);
      }
    },
    [reducedMotion]
  );

  useEffect(() => {
    if (!reducedMotion && toast) {
      const id = setTimeout(() => setToast(null), 900);
      return () => clearTimeout(id);
    }
  }, [toast, reducedMotion]);

  async function submit() {
    if (!mod || !challenge || !bundle) return;
    const g = gradeTranslation(input, challenge);
    if (g.verdict === "correct") {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setCorrectCount((c) => c + 1);
      const p = await getProfile();
      const aw = computeAwards(
        pack.manifest,
        pack.skillTree,
        purchased,
        g,
        {
          challenge,
          module: mod,
          comboCount: nextCombo,
          streakDays: p.streak,
          correctStreakInLevel: 0,
          levelXpMultiplier: bundle.level.xpMultiplier,
        }
      );
      if (aw) {
        const nextXp = p.xp + aw.xp;
        const nextUserLevel = levelFromTotalXp(nextXp);
        await saveProfile({
          ...p,
          currency: p.currency + aw.currency,
          xp: nextXp,
          userLevel: nextUserLevel,
        });
        pushToast("cur", aw.currency);
        setTimeout(() => pushToast("xp", aw.xp), 150);
      }
    } else {
      setCombo(0);
    }

    if (idx + 1 >= total) {
      const acc = (correctCount + (g.verdict === "correct" ? 1 : 0)) / total;
      let stars = 1;
      if (acc >= pack.manifest.stars.threeStarMinAccuracy) stars = 3;
      else if (acc >= pack.manifest.stars.twoStarMinAccuracy) stars = 2;
      await saveLevelRun(levelId, stars, acc);
      await recordDailyStreakIfNeeded();
      setFinished({ acc, stars });
    } else {
      setIdx((i) => i + 1);
      setInput("");
    }
  }

  if (!bundle || !mod) {
    return (
      <div className="screen">
        <p>Missing level data.</p>
        <button type="button" className="btn" onClick={onBack}>
          {t("en_id.ui.back")}
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="screen stack modal-like">
        <h2>{t("en_id.ui.level_complete")}</h2>
        <p>
          {t("en_id.ui.accuracy")}: {Math.round(finished.acc * 100)}%
        </p>
        <p>
          {t("en_id.ui.stars")}: {"★".repeat(finished.stars)}
        </p>
        <button type="button" className="btn primary" onClick={onDone}>
          OK
        </button>
      </div>
    );
  }

  return (
    <div className="screen stack level-play">
      <div className="row spread">
        <button type="button" className="btn ghost" onClick={onBack}>
          ← {t("en_id.ui.back")}
        </button>
        <div className="chips">
          <span className="chip">
            {t("en_id.ui.combo")}: {combo}
          </span>
          <span className="chip">
            {idx + 1}/{total}
          </span>
        </div>
      </div>

      <div className="prompt-card">
        <p className="prompt">{t(challenge.promptKey)}</p>
        {challenge.hintKey && (
          <p className="muted small">
            {t("en_id.ui.hint")}: {t(challenge.hintKey)}
          </p>
        )}
      </div>

      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          className="answer-input"
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("en_id.ui.submit")}
          aria-label="Answer"
        />
        <button type="submit" className="btn primary">
          {t("en_id.ui.submit")}
        </button>
      </form>

      {toast && (
        <div className={`float-award ${toast.kind}`} key={`${toast.kind}-${toast.n}`}>
          +{toast.n} {toast.kind === "cur" ? t("en_id.ui.currency_name") : "XP"}
        </div>
      )}

      <footer className="muted small">{rankTitleForLevel(profile.userLevel)}</footer>
    </div>
  );
}
