import { useCallback, useEffect, useState } from "react";
import { rollGacha } from "../core/gacha";
import type { LoadedPack } from "../services/contentLoader";
import { resolveKey } from "../services/contentLoader";
import {
  addOwnedCosmetic,
  getGachaPity,
  getOwnedCosmetics,
  getProfile,
  saveProfile,
  setGachaPity,
} from "../services/db";

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function GachaScreen(props: {
  pack: LoadedPack;
  onBack: () => void;
  onUpdated: () => void;
}) {
  const { pack, onBack, onUpdated } = props;
  const t = (k: string, vars?: Record<string, string | number>) => resolveKey(pack.strings, k, vars);
  const pool = pack.gachaPool;
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pity, setPity] = useState(0);

  const refreshPity = useCallback(async () => {
    setPity(await getGachaPity(pool.id));
  }, [pool.id]);

  useEffect(() => {
    void refreshPity();
  }, [refreshPity]);

  async function pull() {
    setBusy(true);
    setMsg(null);
    try {
      const p = await getProfile();
      if (p.currency < pool.pullCost) {
        setMsg("Not enough currency.");
        return;
      }
      const owned = await getOwnedCosmetics();
      const pityCount = await getGachaPity(pool.id);
      const rng = mulberry32(Date.now() % 1_000_000_001);
      const r = rollGacha({
        pool,
        catalog: pack.cosmetics,
        ownedCosmeticIds: owned,
        pityPullsSinceRarePlus: pityCount,
        rng,
      });
      await saveProfile({
        ...p,
        currency: p.currency - pool.pullCost,
        shards: p.shards + r.shards,
      });
      if (!r.isDuplicate) {
        await addOwnedCosmetic(r.cosmetic.id);
      }
      await setGachaPity(pool.id, r.nextPityPullsSinceRarePlus);
      await refreshPity();
      const name = t(r.cosmetic.nameKey);
      setMsg(
        r.isDuplicate
          ? `${t("en_id.ui.duplicate_shards", { n: r.shards })} (${name})`
          : `New: ${name} (${r.cosmetic.rarity})`
      );
      onUpdated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen stack">
      <button type="button" className="btn ghost" onClick={onBack}>
        ← {t("en_id.ui.back")}
      </button>
      <h2>{t("en_id.ui.gacha")}</h2>
      <p className="muted small">{t(pool.nameKey)}</p>
      <p>
        {t("en_id.ui.cost")}: {pool.pullCost} · {t("en_id.ui.pity")}: {pity}
        {pool.pity?.hardPityEvery ? ` / ${pool.pity.hardPityEvery}` : ""}
      </p>
      <button type="button" className="btn primary" disabled={busy} onClick={() => void pull()}>
        {t("en_id.ui.pull")}
      </button>
      {msg && <p className="gacha-msg">{msg}</p>}
      <table className="rate-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Weight</th>
          </tr>
        </thead>
        <tbody>
          {pool.entries.map((e) => {
            const it = pack.cosmetics.items.find((i) => i.id === e.cosmeticId);
            return (
              <tr key={e.cosmeticId}>
                <td>{it ? t(it.nameKey) : e.cosmeticId}</td>
                <td>{e.weight}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
