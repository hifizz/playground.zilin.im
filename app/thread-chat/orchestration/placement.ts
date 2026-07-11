/**
 * orchestration/placement —— 「列满怎么办」的放置策略（Strategy 模式，纯函数、可单测）。
 *
 * 列槽模型：slots = { id, folded }[]。folded=true 表示该槽折叠为 30px 竖直细条，
 * 细条不计入展开上限、可累积。两个策略：
 * · replace（方案⑥，默认）：列满替换来源列，无来源替换 LRU 列，可撤销（folded 恒 false）；
 * · fold（方案⑤细条）：列满不替换——新列照常追加，同时把展开列中「LRU 且非来源、
 *   非新开」的一列原地折成细条；点细条原地展开，展开后超限则再折叠一条 LRU。
 */

import { lruIndex } from "../core/selectors";

export type PlacementMode = "replace" | "fold";

export interface Slot {
  id: string;
  folded: boolean;
}

export interface PlaceCtx {
  /** 来源列（从哪一列发起的打开动作），replace 策略优先替换它 */
  sourceId?: string | null;
  /** 展开列的数量上限（= 总列数 - 主线一列） */
  maxExpanded: number;
  /** LRU 依据：会话的活跃计数 */
  lastActiveOf: (id: string) => number;
}

export type PlaceEffect =
  | { kind: "visible" } // 目标已展开可见（或细条已原地展开且未挤掉别列），只需 flash
  | { kind: "appended" } // 有空位，追加了新列
  | { kind: "replaced"; idx: number; replacedId: string; prevSlots: Slot[] } // ⑥：替换（可撤销）
  | { kind: "folded"; foldedId: string }; // ⑤：目标已可见，同时把另一列折成了细条

export interface PlaceResult {
  slots: Slot[];
  effect: PlaceEffect;
}

export type PlacementStrategy = (slots: Slot[], threadId: string, ctx: PlaceCtx) => PlaceResult;

const cloneSlots = (slots: Slot[]) => slots.map((s) => ({ ...s }));
const expandedOf = (slots: Slot[]) => slots.filter((s) => !s.folded);

/* ---------------- 方案⑥：列满替换 ---------------- */
export const replaceStrategy: PlacementStrategy = (slots, threadId, ctx) => {
  const at = slots.findIndex((s) => s.id === threadId);
  if (at >= 0) {
    // replace 策略下不应存在细条；防御：若有（策略切换的瞬时态）则原地展开
    if (slots[at].folded) {
      const next = cloneSlots(slots);
      next[at].folded = false;
      return { slots: next, effect: { kind: "visible" } };
    }
    return { slots, effect: { kind: "visible" } };
  }
  if (slots.length < ctx.maxExpanded) {
    return { slots: [...cloneSlots(slots), { id: threadId, folded: false }], effect: { kind: "appended" } };
  }
  // 列满：替换来源列；来源不可见时替换最久未使用的列
  let idx = ctx.sourceId ? slots.findIndex((s) => s.id === ctx.sourceId) : -1;
  if (idx < 0) idx = lruIndex(slots.map((s) => s.id), ctx.lastActiveOf);
  const prevSlots = cloneSlots(slots);
  const replacedId = slots[idx].id;
  const next = cloneSlots(slots);
  next[idx] = { id: threadId, folded: false };
  return { slots: next, effect: { kind: "replaced", idx, replacedId, prevSlots } };
};

/* ---------------- 方案⑤：列满折叠细条 ---------------- */
export const foldStrategy: PlacementStrategy = (slots, threadId, ctx) => {
  const at = slots.findIndex((s) => s.id === threadId);
  if (at >= 0 && !slots[at].folded) return { slots, effect: { kind: "visible" } };

  let next: Slot[];
  let appended = false;
  if (at >= 0) {
    // 目标是细条：原地展开
    next = cloneSlots(slots);
    next[at].folded = false;
  } else {
    next = [...cloneSlots(slots), { id: threadId, folded: false }];
    appended = true;
  }

  const doneEffect: PlaceEffect = appended ? { kind: "appended" } : { kind: "visible" };
  const expanded = expandedOf(next);
  if (expanded.length <= ctx.maxExpanded) return { slots: next, effect: doneEffect };

  // 展开数超限：折叠一条 LRU（永不折新开的目标；优先不折来源列，实在没得选才折它）
  const preferred = expanded.filter((s) => s.id !== threadId && s.id !== ctx.sourceId);
  const pool = preferred.length ? preferred : expanded.filter((s) => s.id !== threadId);
  if (!pool.length) return { slots: next, effect: doneEffect }; // 理论上到不了，保证不崩
  const foldId = pool[lruIndex(pool.map((s) => s.id), ctx.lastActiveOf)].id;
  const out = next.map((s) => (s.id === foldId ? { ...s, folded: true } : s));
  return { slots: out, effect: { kind: "folded", foldedId: foldId } };
};

export const strategies: Record<PlacementMode, PlacementStrategy> = {
  replace: replaceStrategy,
  fold: foldStrategy,
};

/** 统一入口：按当前模式放置 */
export function place(
  mode: PlacementMode,
  slots: Slot[],
  threadId: string,
  ctx: PlaceCtx,
): PlaceResult {
  return strategies[mode](slots, threadId, ctx);
}

/**
 * 窄屏 / 强制列数收缩时的裁列：从最左的槽裁起（不分细条与否），
 * 直到展开列数不超过上限。replace 模式下等价于原先的「slice 掉最早的列」。
 */
export function trimSlots(slots: Slot[], maxExpanded: number): Slot[] {
  const out = cloneSlots(slots);
  while (out.length && expandedOf(out).length > Math.max(0, maxExpanded)) out.shift();
  return out;
}

/**
 * fold → replace 的模式切换归一化：把所有细条展开，再从左裁掉超限列。
 * 返回归一化后的 slots 与被裁掉的会话 id（供 toast 说明）。
 */
export function normalizeForReplace(
  slots: Slot[],
  maxExpanded: number,
): { slots: Slot[]; dropped: string[] } {
  const expanded = slots.map((s) => ({ id: s.id, folded: false }));
  const keep = Math.max(0, maxExpanded);
  const dropCount = Math.max(0, expanded.length - keep);
  return { slots: expanded.slice(dropCount), dropped: expanded.slice(0, dropCount).map((s) => s.id) };
}
