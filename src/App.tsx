import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { loadEnIdPack } from "./services/contentLoader";
import {
  getAllLevelRuns,
  getEquipped,
  getProfile,
  getPurchasedNodes,
  initDb,
  resetAllProgress,
  seedZeroCostPurchases,
} from "./services/db";
import { Hub } from "./screens/Hub";
import { SkillTreeScreen } from "./screens/SkillTreeScreen";
import { ModulesScreen } from "./screens/ModulesScreen";
import { LevelScreen } from "./screens/LevelScreen";
import { GachaScreen } from "./screens/GachaScreen";
import { WardrobeScreen } from "./screens/WardrobeScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

type View =
  | { name: "hub" }
  | { name: "tree" }
  | { name: "modules" }
  | { name: "gacha" }
  | { name: "wardrobe" }
  | { name: "settings" }
  | { name: "level"; moduleId: string; levelId: string };

export default function App() {
  const pack = useMemo(() => loadEnIdPack(), []);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>({ name: "hub" });
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getProfile>> | null>(null);
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [levelRuns, setLevelRuns] = useState<Map<string, { stars: number; accuracy: number; completed: boolean }>>(
    new Map()
  );
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [reducedMotion, setReducedMotion] = useState(false);

  const refresh = useCallback(async () => {
    setProfile(await getProfile());
    setPurchased(await getPurchasedNodes());
    setLevelRuns(await getAllLevelRuns());
    setEquipped(await getEquipped());
  }, []);

  useEffect(() => {
    void (async () => {
      await initDb();
      await seedZeroCostPurchases(pack.skillTree.nodes);
      await refresh();
      setReady(true);
    })();
  }, [pack.skillTree.nodes, refresh]);

  if (!ready || !profile) {
    return (
      <div className="app-loading">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className={`app ${reducedMotion ? "reduce-motion" : ""}`}>
      {view.name === "hub" && (
        <Hub
          pack={pack}
          profile={profile}
          equipped={equipped}
          onNav={(v) => setView({ name: v } as View)}
        />
      )}
      {view.name === "tree" && (
        <SkillTreeScreen
          pack={pack}
          profile={profile}
          purchased={purchased}
          onBack={() => setView({ name: "hub" })}
          onUpdated={() => void refresh()}
        />
      )}
      {view.name === "modules" && (
        <ModulesScreen
          pack={pack}
          profile={profile}
          purchased={purchased}
          levelRuns={levelRuns}
          onBack={() => setView({ name: "hub" })}
          onOpenLevel={(moduleId, levelId) => setView({ name: "level", moduleId, levelId })}
        />
      )}
      {view.name === "level" && (
        <LevelScreen
          key={`${view.moduleId}-${view.levelId}`}
          pack={pack}
          profile={profile}
          purchased={purchased}
          moduleId={view.moduleId}
          levelId={view.levelId}
          reducedMotion={reducedMotion}
          onBack={() => setView({ name: "modules" })}
          onDone={() => void refresh().then(() => setView({ name: "modules" }))}
        />
      )}
      {view.name === "gacha" && (
        <GachaScreen pack={pack} onBack={() => setView({ name: "hub" })} onUpdated={() => void refresh()} />
      )}
      {view.name === "wardrobe" && (
        <WardrobeScreen pack={pack} onBack={() => setView({ name: "hub" })} onUpdated={() => void refresh()} />
      )}
      {view.name === "settings" && (
        <SettingsScreen
          pack={pack}
          reducedMotion={reducedMotion}
          setReducedMotion={setReducedMotion}
          onBack={() => setView({ name: "hub" })}
          onReset={async () => {
            await resetAllProgress();
            await seedZeroCostPurchases(pack.skillTree.nodes);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
