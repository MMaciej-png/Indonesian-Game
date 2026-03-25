import type { LoadedPack } from "../services/contentLoader";
import { resolveKey } from "../services/contentLoader";
import { isMemoryPersistence } from "../services/db";

export function SettingsScreen(props: {
  pack: LoadedPack;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  onBack: () => void;
  onReset: () => void;
}) {
  const { pack, reducedMotion, setReducedMotion, onBack, onReset } = props;
  const t = (k: string) => resolveKey(pack.strings, k);

  return (
    <div className="screen stack">
      <button type="button" className="btn ghost" onClick={onBack}>
        ← {t("en_id.ui.back")}
      </button>
      <h2>{t("en_id.ui.settings")}</h2>
      <label className="row">
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={(e) => {
            setReducedMotion(e.target.checked);
            document.documentElement.classList.toggle("reduce-motion", e.target.checked);
          }}
        />
        {t("en_id.ui.reduced_motion")}
      </label>
      <p className="muted small">
        Gacha uses only in-game currency. {isMemoryPersistence() ? "Running in browser fallback (local memory)." : ""}
      </p>
      <button
        type="button"
        className="btn danger"
        onClick={() => {
          if (confirm("Reset all progress?")) {
            void onReset();
          }
        }}
      >
        {t("en_id.ui.reset_progress")}
      </button>
    </div>
  );
}
