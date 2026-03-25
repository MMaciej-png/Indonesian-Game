import { useMemo, useState } from "react";
import { canPurchaseNode } from "../core";
import type { LoadedPack } from "../services/contentLoader";
import { resolveKey } from "../services/contentLoader";
import type { Profile } from "../services/db";
import { addPurchasedNode, getProfile, saveProfile } from "../services/db";

export function SkillTreeScreen(props: {
  pack: LoadedPack;
  profile: Profile;
  purchased: Set<string>;
  onBack: () => void;
  onUpdated: () => void;
}) {
  const { pack, profile, purchased, onBack, onUpdated } = props;
  const t = (k: string) => resolveKey(pack.strings, k);
  const tree = pack.skillTree;
  const [selected, setSelected] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const byBranch = useMemo(() => {
    const m = new Map<string, typeof tree.nodes>();
    for (const n of tree.nodes) {
      const b = n.branch ?? "misc";
      if (!m.has(b)) m.set(b, []);
      m.get(b)!.push(n);
    }
    return m;
  }, [tree]);

  const node = selected ? tree.nodes.find((n) => n.id === selected) : null;

  async function buy(id: string) {
    const p = await getProfile();
    const check = canPurchaseNode(tree, purchased, id, p.currency);
    if (!check.ok) return;
    const cost = tree.nodes.find((n) => n.id === id)!.cost;
    await saveProfile({
      ...p,
      currency: p.currency - cost,
    });
    await addPurchasedNode(id);
    setFlash(id);
    setTimeout(() => setFlash(null), 600);
    onUpdated();
  }

  return (
    <div className="screen stack">
      <div className="row spread">
        <button type="button" className="btn ghost" onClick={onBack}>
          ← {t("en_id.ui.back")}
        </button>
        <div className="chip">
          {t("en_id.ui.balance")}: {profile.currency} {t("en_id.ui.currency_name")}
        </div>
      </div>
      <h2>{t("en_id.ui.skill_tree")}</h2>
      <p className="muted small">
        {t("en_id.ui.purchase")} nodes to unlock boosts and modules. Pan: scroll wheel (zoom) — drag background (when
        wired).
      </p>

      <div className="tree-canvas">
        {[...byBranch.entries()].map(([branch, nodes]) => (
          <section key={branch} className={`branch rail-${branch}`}>
            <h3 className="branch-title">{branch}</h3>
            <div className="node-grid">
              {nodes.map((n) => {
                const owned = purchased.has(n.id);
                const check = canPurchaseNode(tree, purchased, n.id, profile.currency);
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`tree-node ${selected === n.id ? "sel" : ""} ${owned ? "owned" : ""} ${flash === n.id ? "purchase-flash" : ""}`}
                    onClick={() => setSelected(n.id)}
                  >
                    <span className="node-type">{n.nodeType === "boost" ? "▲" : "📘"}</span>
                    <span className="node-title">{t(n.titleKey)}</span>
                    <span className="node-meta">
                      {owned ? t("en_id.ui.owned") : `${t("en_id.ui.cost")} ${n.cost}`}
                    </span>
                    {!owned && !check.ok && <span className="tag locked">{t("en_id.ui.locked")}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {node && (
        <aside className="detail-panel">
          <h4>{t(node.titleKey)}</h4>
          <p className="muted">{t(node.descriptionKey)}</p>
          {node.nodeType === "boost" && node.effects && (
            <pre className="effects">{JSON.stringify(node.effects, null, 2)}</pre>
          )}
          {node.nodeType === "content" && node.grantsModuleIds && (
            <p>
              <strong>Modules:</strong> {node.grantsModuleIds.join(", ")}
            </p>
          )}
          {!purchased.has(node.id) && node.cost > 0 && (
            <button
              type="button"
              className="btn primary"
              disabled={!canPurchaseNode(tree, purchased, node.id, profile.currency).ok}
              onClick={() => void buy(node.id)}
            >
              {t("en_id.ui.purchase")} ({node.cost})
            </button>
          )}
        </aside>
      )}
    </div>
  );
}
