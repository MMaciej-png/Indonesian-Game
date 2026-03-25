import type { Profile } from "../services/db";
import type { LoadedPack } from "../services/contentLoader";
import { resolveKey } from "../services/contentLoader";
import { rankTitleForLevel, xpToReachLevel } from "../core";

const SLOT_EMOJI: Record<string, string> = {
  hat: "🧢",
  clothes: "👕",
  shoes: "🩴",
  background: "🌆",
};

export function Hub(props: {
  pack: LoadedPack;
  profile: Profile;
  equipped: Record<string, string>;
  onNav: (v: "tree" | "modules" | "gacha" | "wardrobe" | "settings") => void;
}) {
  const { pack, profile, equipped, onNav } = props;
  const t = (k: string) => resolveKey(pack.strings, k);
  const title = rankTitleForLevel(profile.userLevel);
  const nextXp = xpToReachLevel(profile.userLevel + 1);
  const prevXp = xpToReachLevel(profile.userLevel);
  const span = Math.max(1, nextXp - prevXp);
  const inSpan = Math.min(1, Math.max(0, (profile.xp - prevXp) / span));

  return (
    <div className="hub">
      <header className="hub-header">
        <div>
          <h1>{t("en_id.ui.app_title")}</h1>
          <p className="muted">{t("en_id.ui.hub_subtitle")}</p>
        </div>
        <div className="hud-strip">
          <div className="chip">
            {t("en_id.ui.balance")}: <strong>{profile.currency}</strong> {t("en_id.ui.currency_name")}
          </div>
          <div className="chip">
            {t("en_id.ui.streak")}: <strong>{profile.streak}</strong>
          </div>
        </div>
      </header>

      <div className="avatar-preview" aria-label="avatar preview">
        {(["hat", "clothes", "shoes", "background"] as const).map((slot) => (
          <span key={slot} className={`avatar-slot slot-${slot}`} title={equipped[slot] ?? ""}>
            {SLOT_EMOJI[slot]}
          </span>
        ))}
      </div>

      <div className="rank-block">
        <div>
          {t("en_id.ui.rank")}: <strong>{title}</strong> · {t("en_id.ui.level")}{" "}
          <strong>{profile.userLevel}</strong>
        </div>
        <div className="xp-bar">
          <div className="xp-bar-fill" style={{ width: `${inSpan * 100}%` }} />
        </div>
        <div className="muted small">
          {t("en_id.ui.xp")}: {profile.xp} / {nextXp}
        </div>
      </div>

      <nav className="hub-nav">
        <button type="button" className="btn primary" onClick={() => onNav("tree")}>
          {t("en_id.ui.skill_tree")}
        </button>
        <button type="button" className="btn" onClick={() => onNav("modules")}>
          {t("en_id.ui.modules")}
        </button>
        <button type="button" className="btn" onClick={() => onNav("gacha")}>
          {t("en_id.ui.gacha")}
        </button>
        <button type="button" className="btn" onClick={() => onNav("wardrobe")}>
          {t("en_id.ui.wardrobe")}
        </button>
        <button type="button" className="btn ghost" onClick={() => onNav("settings")}>
          {t("en_id.ui.settings")}
        </button>
      </nav>
    </div>
  );
}
