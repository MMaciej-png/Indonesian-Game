import { useEffect, useState } from "react";
import type { CosmeticSlot } from "../core/types";
import type { LoadedPack } from "../services/contentLoader";
import { resolveKey } from "../services/contentLoader";
import { getEquipped, getOwnedCosmetics, setEquippedSlot } from "../services/db";

const SLOTS: CosmeticSlot[] = ["hat", "clothes", "shoes", "background"];

export function WardrobeScreen(props: {
  pack: LoadedPack;
  onBack: () => void;
  onUpdated: () => void;
}) {
  const { pack, onBack, onUpdated } = props;
  const t = (k: string) => resolveKey(pack.strings, k);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [equipped, setEquipped] = useState<Record<string, string>>({});

  async function reload() {
    setOwned(await getOwnedCosmetics());
    setEquipped(await getEquipped());
  }

  useEffect(() => {
    void reload();
  }, []);

  async function equip(slot: CosmeticSlot, cosmeticId: string) {
    await setEquippedSlot(slot, cosmeticId);
    await reload();
    onUpdated();
  }

  async function clear(slot: CosmeticSlot) {
    await setEquippedSlot(slot, null);
    await reload();
    onUpdated();
  }

  const ownedItems = pack.cosmetics.items.filter((i) => owned.has(i.id));

  return (
    <div className="screen stack">
      <button type="button" className="btn ghost" onClick={onBack}>
        ← {t("en_id.ui.back")}
      </button>
      <h2>{t("en_id.ui.wardrobe")}</h2>
      {SLOTS.map((slot) => (
        <section key={slot} className="wardrobe-slot">
          <h3>{slot}</h3>
          <p className="muted small">
            {t("en_id.ui.equip")}: {equipped[slot] ?? "—"}
          </p>
          <div className="row wrap">
            {ownedItems
              .filter((i) => i.slot === slot)
              .map((i) => (
                <button key={i.id} type="button" className="btn small" onClick={() => void equip(slot, i.id)}>
                  {t(i.nameKey)}
                </button>
              ))}
            <button type="button" className="btn ghost small" onClick={() => void clear(slot)}>
              {t("en_id.ui.unequip")}
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
