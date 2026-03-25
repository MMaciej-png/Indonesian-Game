import { evaluateModuleUnlockWithCatalog, type UnlockState } from "../core/unlock";
import type { LoadedPack } from "../services/contentLoader";
import { resolveKey } from "../services/contentLoader";
import type { Profile } from "../services/db";

export function ModulesScreen(props: {
  pack: LoadedPack;
  profile: Profile;
  purchased: Set<string>;
  levelRuns: Map<string, { stars: number; accuracy: number; completed: boolean }>;
  onBack: () => void;
  onOpenLevel: (moduleId: string, levelId: string) => void;
}) {
  const { pack, profile, purchased, levelRuns, onBack, onOpenLevel } = props;
  const t = (k: string) => resolveKey(pack.strings, k);

  const ustate: UnlockState = {
    userLevel: profile.userLevel,
    purchasedSkillNodeIds: purchased,
    levelRuns: new Map(
      [...levelRuns].map(([id, r]) => [
        id,
        { levelId: id, stars: r.stars, accuracy: r.accuracy, completed: r.completed },
      ])
    ),
  };

  return (
    <div className="screen stack">
      <button type="button" className="btn ghost" onClick={onBack}>
        ← {t("en_id.ui.back")}
      </button>
      <h2>{t("en_id.ui.modules")}</h2>
      <ul className="module-list">
        {pack.modules.map((m) => {
          const open = evaluateModuleUnlockWithCatalog(m, pack.skillTree, ustate, pack.modulesById);
          return (
            <li key={m.id} className={`module-card ${open ? "" : "disabled"}`}>
              <div>
                <h3>{t(m.titleKey)}</h3>
                <p className="muted small">{t(m.descriptionKey)}</p>
                <p className="tag">{m.contentKind}</p>
              </div>
              {!open && <span className="tag locked">{t("en_id.ui.locked")}</span>}
              {open && (
                <ul className="level-list">
                  {m.levelIds.map((lid) => {
                    const run = levelRuns.get(lid);
                    const bundle = pack.levelById.get(lid);
                    return (
                      <li key={lid}>
                        <button
                          type="button"
                          className="btn small"
                          onClick={() => onOpenLevel(m.id, lid)}
                          disabled={!bundle}
                        >
                          {bundle ? t(bundle.level.titleKey) : lid}
                          {run?.completed ? ` ★${run.stars}` : ""}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
