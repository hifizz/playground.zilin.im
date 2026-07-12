"use client";
/**
 * branching/selection-bubble —— 划选 assistant 消息文字 → 迷你气泡 → 开分支。
 *
 * document 级监听 + 命令式 DOM Selection 读取（这部分天然绕不开命令式 API）。
 * 气泡的开合状态由上层持有（sel / onSelChange），以便 Esc 逐层关闭链能先关它。
 *
 * 放置控制（存在 ≥1 个分支列时显示，见任务「打开到哪一列」）：
 * · 底部迷你列条按当前列序预览「新分支会放到哪」——将替换（斜纹）/ 将折叠 / 插入
 *   位置的虚线幽灵格，全部来自 placement.previewPlacement（与提交共用同一套规则，
 *   预览不撒谎）；主线小格锚定不可选；
 * · 点非主线小格 = 显式指定让位列（override，再点同格取消）；
 * · 按住 ⌘/Ctrl = 保留来源列、新列开在其紧邻右侧（气泡实时跟踪修饰键，按钮文案
 *   与列条目标同步切换）。生效目标 = override > 修饰键 > 默认规则。
 *
 * 可选输入框（fork 首条消息策略「默认代拟 + 可选带问」）：
 * · 留空提交 = 现状：分支以引导回复开场（接真实模型后为代拟首问）；
 * · 输入后提交 = 用户问题成为分支首条 user 消息（store.fork 的 firstQuestion）；
 * · Enter 提交 / Shift+Enter 换行 / ⌘Enter 提交且保留本列（与 ⌘ 点击同语义）。
 */

import React, { useEffect, useRef, useState } from "react";
import { GitFork } from "lucide-react";
import type { ThreadTreeState } from "../core/types";
import { threadTitle } from "../core/selectors";
import {
  previewPlacement,
  type PlacementHint,
  type PlacementMode,
  type Slot,
} from "../orchestration/placement";

export interface SelectionInfo {
  text: string;
  threadId: string;
  msgId: string;
  x: number;
  y: number;
  /** 划选结束（mouseup）那一刻是否按着 ⌘/Ctrl：作为修饰键跟踪的初值 */
  meta?: boolean;
  /** 划选处前后 ≤32 字的原文上下文（TextQuoteSelector 式，供锚点鲁棒定位） */
  prefix?: string;
  suffix?: string;
}

export interface SelectionBubbleProps {
  state: ThreadTreeState;
  sel: SelectionInfo | null;
  onSelChange: (s: SelectionInfo | null) => void;
  /** 提交开分支：上层负责真正 fork + 放置；hint 见 placement.ts；question = 输入框里的首问（可选） */
  onFork: (s: SelectionInfo, hint?: PlacementHint, question?: string) => void;
  /* —— 迷你列条的放置上下文（与提交走同一套 placement 规则）—— */
  slots: Slot[];
  mode: PlacementMode;
  maxExpanded: number;
  lastActiveOf: (id: string) => number;
}

export function SelectionBubble({
  state,
  sel,
  onSelChange,
  onFork,
  slots,
  mode,
  maxExpanded,
  lastActiveOf,
}: SelectionBubbleProps) {
  /** 迷你列条点选的让位列（override）；气泡隐藏 / 换一段划选时清空 */
  const [override, setOverride] = useState<string | null>(null);
  /** ⌘/Ctrl 是否按住（实时跟踪，目标与按钮文案随之切换） */
  const [metaHeld, setMetaHeld] = useState(false);
  /** 可选首问（受控 textarea；留空提交 = 现状引导回复路径） */
  const [question, setQuestion] = useState("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  /** 渲染期间的派生状态调整（React 官方写法）：sel 变化 = 新一次划选，重置各态 */
  const [forSel, setForSel] = useState<SelectionInfo | null>(sel);
  if (forSel !== sel) {
    setForSel(sel);
    setOverride(null);
    setMetaHeld(sel?.meta ?? false);
    setQuestion("");
  }

  /* 气泡弹出即聚焦输入框（preventScroll：定位刚结算完，不能再引发滚动） */
  useEffect(() => {
    if (sel) taRef.current?.focus({ preventScroll: true });
  }, [sel]);

  /* 划选监听：mouseup 结算选区并定位气泡；mousedown / 滚动 / resize 隐藏 */
  useEffect(() => {
    // 有分支列时气泡多出一行迷你列条（约 46px），夹取阈值同步放大避免贴底裁切
    const extraH = slots.length > 0 ? 46 : 0;
    const onMouseUp = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.(".sel-bubble")) return;
      const meta = e.metaKey || e.ctrlKey;
      // 等浏览器把 Selection 结算完再读（与拖选结束存在竞态）
      setTimeout(() => {
        const s = window.getSelection();
        const txt = s?.toString().trim() ?? "";
        if (!s || !txt || txt.length < 2) {
          onSelChange(null);
          return;
        }
        const node = s.anchorNode;
        if (!node) return;
        const base =
          node.nodeType === Node.TEXT_NODE ? (node as Text).parentElement : (node as HTMLElement);
        const host = base?.closest?.('.bubble[data-role="assistant"]');
        if (!host) {
          onSelChange(null);
          return;
        }
        const listEl = host.closest(".msg-list") as HTMLElement | null;
        const msgEl = host.closest(".message") as HTMLElement | null;
        const threadId = listEl?.dataset.list;
        const msgId = msgEl?.dataset.msgId;
        if (!threadId || !msgId) return;
        // 校验划选文字确实是这条消息的连续原文（跨消息 / 跨段选择不弹气泡）
        const msg = state.threads[threadId]?.messages.find((m) => m.id === msgId);
        if (!msg || msg.text.indexOf(txt) === -1) {
          onSelChange(null);
          return;
        }
        // 同文多次出现的消歧：数 DOM 里选区之前有几次 txt（脚注上标的数字不影响计数），
        // 换算成 msg.text 中的第 N 次出现，截取前后 ≤32 字作 TextQuoteSelector 上下文
        const range = s.getRangeAt(0);
        let occ = 0;
        try {
          const pre = document.createRange();
          pre.selectNodeContents(host);
          pre.setEnd(range.startContainer, range.startOffset);
          const preText = pre.toString();
          for (let k = preText.indexOf(txt); k !== -1; k = preText.indexOf(txt, k + 1)) occ++;
        } catch {
          occ = 0; // 选区起点不在气泡内等异常：退回首次出现
        }
        let start = -1;
        for (let k = 0, from = 0; k <= occ; k++) {
          start = msg.text.indexOf(txt, from);
          if (start === -1) break;
          from = start + 1;
        }
        if (start === -1) start = msg.text.indexOf(txt);
        const prefix = msg.text.slice(Math.max(0, start - 32), start);
        const suffix = msg.text.slice(start + txt.length, start + txt.length + 32);
        const rect = range.getBoundingClientRect();
        const left = Math.max(10, Math.min(rect.left, window.innerWidth - 244));
        let top = rect.bottom + 9;
        if (top > window.innerHeight - (190 + extraH)) top = Math.max(10, rect.top - (172 + extraH));
        onSelChange({ text: txt, threadId, msgId, x: left, y: top, meta, prefix, suffix });
      }, 10);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest?.(".sel-bubble")) onSelChange(null);
    };
    const onScroll = () => onSelChange(null);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [state, onSelChange, slots]);

  /* 气泡打开期间跟踪 ⌘/Ctrl 起落（keydown/keyup 都带 metaKey/ctrlKey 快照） */
  useEffect(() => {
    if (!sel) return;
    const sync = (e: KeyboardEvent) => setMetaHeld(e.metaKey || e.ctrlKey);
    const onBlur = () => setMetaHeld(false);
    document.addEventListener("keydown", sync);
    document.addEventListener("keyup", sync);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("keydown", sync);
      document.removeEventListener("keyup", sync);
      window.removeEventListener("blur", onBlur);
    };
  }, [sel]);

  if (!sel) return null;

  /* —— 生效目标 = override > 修饰键推导 > 默认规则（列条与提交共用 hint） —— */
  const ov = override && slots.some((s) => s.id === override && !s.folded) ? override : null;
  const hint: PlacementHint | undefined = ov
    ? { targetId: ov }
    : metaHeld
      ? { keepSource: true }
      : undefined;
  const hasMap = slots.length > 0; // 仅主线时无需放置控制，不显示列条
  const preview = hasMap
    ? previewPlacement(mode, slots, { sourceId: sel.threadId, maxExpanded, lastActiveOf, hint })
    : null;

  const hasQuestion = question.trim().length > 0;
  const btnLabel = ov
    ? `开启并${mode === "replace" ? "替换" : "折叠"}『${threadTitle(state, ov)}』`
    : metaHeld
      ? "在右侧新列打开"
      : hasQuestion
        ? "带着问题开分支"
        : "开启分支讨论";

  /** 统一提交：按钮点击与输入框 Enter 共用（metaFromEvent 与跟踪态任一为真即 keepSource） */
  const submit = (metaFromEvent: boolean) => {
    const h: PlacementHint | undefined = ov
      ? { targetId: ov }
      : metaFromEvent || metaHeld
        ? { keepSource: true }
        : undefined;
    const q = question.trim();
    window.getSelection()?.removeAllRanges();
    onSelChange(null);
    onFork(sel, h, q || undefined);
  };

  /* —— 迷你列条：主线 + 各槽位（+ 插入位置的幽灵格），标注将替换 / 将折叠 / 本列 —— */
  const ghost = (
    <span key="ghost" className="smcell ghost" title="新分支将插入此处" aria-hidden="true">
      +
    </span>
  );
  const cells: React.ReactNode[] = [];
  if (hasMap) {
    cells.push(
      <span
        key="main"
        className="smcell main"
        role="button"
        aria-disabled="true"
        title={threadTitle(state, "main")}
        aria-label={threadTitle(state, "main")}
      />,
    );
    const showGhost = preview !== null && preview.replaceId === null;
    slots.forEach((s, i) => {
      if (showGhost && preview.insertAt === i) cells.push(ghost);
      const title = threadTitle(state, s.id);
      const isSrc = s.id === sel.threadId;
      const willReplace = preview?.replaceId === s.id;
      const willFold = preview?.foldId === s.id;
      const cap = willReplace
        ? isSrc
          ? "本列·替"
          : "将替换"
        : willFold
          ? isSrc
            ? "本列·折"
            : "将折叠"
          : isSrc
            ? "本列"
            : null;
      const toggle = () => setOverride((o) => (o === s.id ? null : s.id));
      cells.push(
        <span
          key={s.id}
          className={`smcell${s.folded ? " folded" : ""}${isSrc ? " src" : ""}${
            willReplace ? " will-replace" : ""
          }${willFold ? " will-fold" : ""}${ov === s.id ? " ov" : ""}`}
          role="button"
          tabIndex={s.folded ? -1 : 0}
          aria-disabled={s.folded ? "true" : undefined}
          title={title}
          aria-label={title}
          onClick={s.folded ? undefined : toggle}
          onKeyDown={
            s.folded
              ? undefined
              : (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle();
                  }
                }
          }
        >
          {cap && <i className="cap">{cap}</i>}
        </span>,
      );
    });
    if (showGhost && preview.insertAt === slots.length) cells.push(ghost);
  }

  return (
    <div className="sel-bubble" style={{ left: sel.x, top: sel.y }}>
      <div className="lbl">在新分支中讨论这段</div>
      <div className="quote">{sel.text}</div>
      <div className="ask">
        <textarea
          ref={taRef}
          rows={1}
          value={question}
          placeholder="就这段问点什么…（可留空）"
          aria-label="就这段划选文字提出你的问题（可留空，留空则自动展开讨论）"
          onChange={(e) => {
            setQuestion(e.target.value);
            const ta = e.currentTarget;
            ta.style.height = "auto";
            ta.style.height = Math.min(ta.scrollHeight, 68) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e.metaKey || e.ctrlKey);
            }
          }}
        />
      </div>
      {hasMap && (
        <div className="slotmap" role="group" aria-label="新分支的放置目标（点小格指定让位列）">
          {cells}
        </div>
      )}
      <button onClick={(e) => submit(e.metaKey || e.ctrlKey)}>
        <GitFork size={14} />
        {btnLabel}
      </button>
    </div>
  );
}
