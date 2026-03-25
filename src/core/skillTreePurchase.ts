import type { SkillTreeData } from "./types";

export type PurchaseResult =
  | { ok: true }
  | { ok: false; reason: "unknown_node" | "already_owned" | "insufficient_funds" | "parents_locked" };

export function canPurchaseNode(
  tree: SkillTreeData,
  purchased: ReadonlySet<string>,
  nodeId: string,
  currency: number
): PurchaseResult {
  const node = tree.nodes.find((n) => n.id === nodeId);
  if (!node) return { ok: false, reason: "unknown_node" };
  if (purchased.has(nodeId)) return { ok: false, reason: "already_owned" };
  if (currency < node.cost) return { ok: false, reason: "insufficient_funds" };

  const parentsOk =
    node.parentIds.length === 0
      ? tree.rootIds.includes(nodeId)
      : node.parentIds.every((pid) => purchased.has(pid));
  if (!parentsOk) {
    return { ok: false, reason: "parents_locked" };
  }
  return { ok: true };
}

export function applyPurchase(
  tree: SkillTreeData,
  purchased: Set<string>,
  nodeId: string,
  currency: number
): { purchased: Set<string>; currency: number; result: PurchaseResult } {
  const check = canPurchaseNode(tree, purchased, nodeId, currency);
  if (!check.ok) {
    return { purchased, currency, result: check };
  }
  const node = tree.nodes.find((n) => n.id === nodeId)!;
  const next = new Set(purchased);
  next.add(nodeId);
  return { purchased: next, currency: currency - node.cost, result: { ok: true } };
}
