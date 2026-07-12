"use client";
/**
 * --------------------------------------------------------------------------
 * Thread Chat · 分支对话（方案⑥ 自适应列 + 列满策略：替换⑥ / 细条⑤）
 * --------------------------------------------------------------------------
 * 顶层壳：只负责状态编排与各层拼装，具体能力分四层实现——
 * · core/          headless 会话树 store + 选择器（useSyncExternalStore 绑定）；
 * · chat/          单会话视图（消息列表 + composer），不知道树/列/分支；
 * · branching/     把「分支能力」注入 chat：锚点/脚注/面包屑/继承上文/划选气泡；
 * · orchestration/ 视图编排：列视图（放置策略：替换⑥/细条⑤、切换器、Artifact 抽屉）
 *                  与画布视图（thread-canvas，React Flow 全树纵览，懒加载）两个平级视图层。
 *
 * 「打开某会话」的统一意图入口是 openBranchUI：脚注 / ⌘K / 每列 ⇄ / 子树弹层 /
 * Artifact 定位来源 / 画布双击节点全部走它——画布模式下先切回列视图（打开 = 去列里读），
 * 列满时按当前策略替换（可撤销）或折叠细条。
 * --------------------------------------------------------------------------
 */

import Link from "next/link";
import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Columns3, Highlighter, Network, PanelRightOpen, RotateCcw, Waypoints } from "lucide-react";
import "./thread-chat.css";
import { artifactSeedFor, seedStore } from "./data";
import { createLiveProvider } from "./live-provider";
import { createThreadStore } from "./core/store";
import { useThreadStore } from "./core/use-thread-store";
import { threadTitle, type TreeRow } from "./core/selectors";
import { BranchableChat } from "./branching/branchable-chat";
import { BubbleThread } from "./branching/bubble-thread";
import { SelectionBubble, type SelectionInfo } from "./branching/selection-bubble";
import { ThreadSheet } from "./branching/thread-sheet";
import { type PlacementHint, type PlacementMode } from "./orchestration/placement";
import {
  COL_MIN_W,
  ThreadColumns,
  useColumnSlots,
  useWindowWidth,
} from "./orchestration/thread-columns";
import { ThreadSwitcher, type SwitcherMode } from "./orchestration/thread-switcher";
import { ArtifactDrawer } from "./orchestration/artifact-drawer";
import type { CanvasViewState } from "./orchestration/use-canvas-layout";

/** 画布视图层懒加载：React Flow 只在首次进入画布模式时才落地（且跳过 SSR） */
const ThreadCanvas = dynamic(
  () => import("./orchestration/thread-canvas").then((m) => m.ThreadCanvas),
  { ssr: false, loading: () => <div className="canvas-loading">画布加载中…</div> },
);

type ViewMode = "columns" | "canvas";

const MAIN_SUBTITLE = "一段关于 Agent 记忆系统的对话";

/** localStorage 持久化槽位（§10.6）：ThreadTreeState 纯 JSON，带版本号防 schema 漂移 */
const PERSIST_KEY = "tc-thread-state-v1";

interface ToastState {
  msg: string;
  undo?: () => void;
  n: number;
}

/** 把面板锚定在按钮下方（夹在视口内），w/h 为面板预估尺寸 */
function anchoredPos(btn: HTMLElement, w: number, h: number) {
  const rect = btn.getBoundingClientRect();
  const x = Math.max(8, Math.min(rect.right - w, window.innerWidth - (w + 8)));
  let y = rect.bottom + 6;
  if (y + h > window.innerHeight) y = Math.max(8, window.innerHeight - (h + 10));
  return { x, y };
}

export function ThreadChatDemo() {
  /* ---------- 会话树：外部可变 store，version 快照驱动重渲；
       回复经 ReplyProvider 流式生成：服务端配了 MINIMAX_API_KEY 则走真实模型
       （/api/thread-chat/reply 流式代理），否则自动回落 mock ---------- */
  const [store] = useState(() => createThreadStore(seedStore(), createLiveProvider()));
  useThreadStore(store);
  const state = store.getState();

  /* 顶栏 pill 显示实际回复模式（与 provider 探测同一个 GET 端点） */
  const [llmModel, setLlmModel] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/thread-chat/reply")
      .then((r) => (r.ok ? (r.json() as Promise<{ live?: boolean; model?: string }>) : null))
      .then((j) => {
        if (alive && j?.live) setLlmModel(j.model ?? "LLM");
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  /* ---------- 持久化（§10.6）：挂载后恢复（首帧渲染种子避免 hydration 不一致，
       随后原地 hydrate），此后每次变更防抖 400ms 存入 localStorage ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PERSIST_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          (parsed as { v?: number }).v === 1 &&
          (parsed as { state?: { threads?: { main?: unknown } } }).state?.threads?.main
        )
          store.hydrate((parsed as { state: Parameters<typeof store.hydrate>[0] }).state);
      }
    } catch {
      /* 存档损坏：忽略，用种子 */
    }
    let timer: number | null = null;
    const unsub = store.subscribe(() => {
      if (timer !== null) clearTimeout(timer);
      timer = window.setTimeout(() => {
        try {
          localStorage.setItem(PERSIST_KEY, JSON.stringify({ v: 1, state: store.getState() }));
        } catch {
          /* 配额满等写入失败：静默（demo 数据可再生） */
        }
      }, 400);
    });
    return () => {
      unsub();
      if (timer !== null) clearTimeout(timer);
    };
  }, [store]);

  /* ---------- 自适应列数（SSR 阶段 winW=null，顶栏显示「列数」占位） ---------- */
  const winW = useWindowWidth();
  const [forceCols, setForceCols] = useState<number | null>(null);
  const autoCols = winW === null ? 3 : Math.max(2, Math.min(4, Math.floor(winW / COL_MIN_W)));
  const totalCols = forceCols ?? autoCols;
  const maxExpanded = totalCols - 1;

  /* ---------- 列槽编排：放置策略（替换⑥ / 细条⑤）+ 槽位状态 ---------- */
  const [mode, setMode] = useState<PlacementMode>("replace");
  const cols = useColumnSlots({ store, maxExpanded, mode });

  /* ---------- 视图形态：列（深读）| 画布（纵览全树） ----------
       移动端（<720px）分栏不成立：首次识别到窄屏时默认切画布（fitView 一屏纵览、
       pan/zoom 是天然手势），此后用户仍可手动切列。渲染期间的派生状态调整写法 */
  const [viewMode, setViewMode] = useState<ViewMode>("columns");
  const isMobile = winW !== null && winW < 720;
  const [mobileDefaulted, setMobileDefaulted] = useState(false);
  if (isMobile && !mobileDefaulted) {
    setMobileDefaulted(true);
    setViewMode("canvas");
  }
  /** 移动端 bottom sheet 视口（画布节点单击唤起；full = 拉满 ≈ 移动端的「升格」） */
  const [sheet, setSheet] = useState<{ threadId: string; full: boolean } | null>(null);
  /** 画布视图状态宿主（节点 pin 表）：跨「列 ⇄ 画布」切换存活，属视口状态不进 core store。
      与上面的 store 同一模式：useState(初始化函数) 造出的长寿可变对象（type-only import，
      不把画布模块拖进首屏 bundle） */
  const [canvasViewState] = useState<CanvasViewState>(() => ({ pins: new Map() }));
  /** 画布内 fork 出的新会话：画布收到后居中并展开（n 递增去重） */
  const [canvasFocus, setCanvasFocus] = useState<{ id: string; n: number } | null>(null);
  const canvasFocusSeq = useRef(0);

  /* ---------- 其余 UI 状态 ---------- */
  const [hintOn, setHintOn] = useState(true);
  const [sel, setSel] = useState<SelectionInfo | null>(null);
  /** 气泡轻对话视口（P10：thread 显示在气泡还是列是视口事实，归壳层持有） */
  const [bubble, setBubble] = useState<{ threadId: string; sourceId: string; collapsed: boolean } | null>(null);
  const [switcher, setSwitcher] = useState<(SwitcherMode & { n: number }) | null>(null);
  const swSeq = useRef(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeArt, setActiveArt] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastSeq = useRef(0);

  function showToast(msg: string, undo?: () => void) {
    setToast({ msg, undo, n: ++toastSeq.current });
  }
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.undo ? 5200 : 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- 统一意图入口：打开某会话（脚注 / ⌘K / 子树 / 定位来源 / 画布双击都走这里）
       hint：可选放置提示（⌘ keepSource「保留来源列，开在其右」/ targetId 显式让位列） ---------- */
  function openBranchUI(id: string, sourceId?: string | null, hint?: PlacementHint) {
    // 意图收敛：打开会话 = 去列里读它——画布模式下先切回列视图再放置；
    // 目标正显示在气泡轻视口时收掉气泡（换视口不换数据）
    setViewMode("columns");
    if (bubble?.threadId === id) setBubble(null);
    if (id === "main") {
      cols.flashThread("main");
      return;
    }
    const eff = cols.openThread(id, sourceId ?? null, hint);
    if (eff.kind === "replaced") {
      showToast(
        `第 ${eff.idx + 2} 列已替换：「${threadTitle(state, eff.replacedId)}」→「${threadTitle(state, id)}」`,
        () => {
          cols.restoreSlots(eff.prevSlots);
          cols.flashThread(eff.replacedId);
        },
      );
    } else if (eff.kind === "folded") {
      showToast(
        `已打开「${threadTitle(state, id)}」，「${threadTitle(state, eff.foldedId)}」已折叠为细条`,
      );
    }
  }

  /* ---------- 开分支：store.fork + 放置 + artifact 自动弹出（hint 来自气泡：⌘ / 列条点选；
       question = 气泡输入框里的可选首问，成为分支首条 user 消息）。
       画布模式（Phase 2 画布内划选）：不占列槽——新节点入树后画布居中并展开它 ---------- */
  function handleFork(s: SelectionInfo, hint?: PlacementHint, question?: string) {
    const r = store.fork({
      sourceThreadId: s.threadId,
      sourceMsgId: s.msgId,
      anchorText: s.text,
      anchorPrefix: s.prefix,
      anchorSuffix: s.suffix,
      firstQuestion: question,
      artifactSeed: artifactSeedFor(s.text),
    });
    if (!r) return;
    if (viewMode === "canvas") {
      setCanvasFocus({ id: r.threadId, n: ++canvasFocusSeq.current });
      if (r.artifactId) {
        setActiveArt(r.artifactId);
        setDrawerOpen(true);
      }
      showToast(`已开启分支 · ${r.title}${r.artifactId ? "（Artifact 已在右侧打开）" : ""}`);
      return;
    }
    const eff = cols.openThread(r.threadId, s.threadId, hint);
    if (r.artifactId) {
      setActiveArt(r.artifactId);
      setDrawerOpen(true);
    }
    const artNote = r.artifactId ? "（Artifact 已在右侧打开）" : "";
    if (eff.kind === "replaced") {
      showToast(
        `已开启分支「${r.title}」，替换了第 ${eff.idx + 2} 列的「${threadTitle(state, eff.replacedId)}」`,
        () => {
          cols.restoreSlots(eff.prevSlots);
          cols.flashThread(eff.replacedId);
        },
      );
    } else if (eff.kind === "folded") {
      showToast(
        `已开启分支「${r.title}」，「${threadTitle(state, eff.foldedId)}」已折叠为细条${artNote}`,
      );
    } else {
      showToast(`已开启分支 · ${r.title}${artNote}`);
    }
  }

  /* ---------- 气泡轻对话：首次提交即 fork 入树（脚注同步落原文）但不占列槽；
       升格 = openBranchUI 换视口，pendingText 作为下一问在列里发出（无损） ---------- */
  function handleStartBubble(s: SelectionInfo, question: string) {
    const r = store.fork({
      sourceThreadId: s.threadId,
      sourceMsgId: s.msgId,
      anchorText: s.text,
      anchorPrefix: s.prefix,
      anchorSuffix: s.suffix,
      firstQuestion: question,
      artifactSeed: artifactSeedFor(s.text),
    });
    if (!r) return;
    setBubble({ threadId: r.threadId, sourceId: s.threadId, collapsed: false });
  }
  function upgradeBubble(pendingText?: string, keepSource?: boolean) {
    if (!bubble) return;
    const { threadId, sourceId } = bubble;
    setBubble(null);
    openBranchUI(threadId, sourceId, keepSource ? { keepSource: true } : undefined);
    if (pendingText) store.send(threadId, pendingText);
  }

  /* ---------- 列满策略切换（fold → replace 时展开全部细条并裁掉超限列） ---------- */
  function changeMode(m: PlacementMode) {
    if (m === mode) return;
    setMode(m);
    if (m === "replace") {
      const dropped = cols.normalizeToReplace();
      if (dropped.length)
        showToast(
          `已切回替换⑥：细条全部展开后，超出列数的「${dropped.map((id) => threadTitle(state, id)).join("」「")}」已收起`,
        );
    }
  }

  /* ---------- 切换器 / 子树面板（互斥：同一时间只开一个；每次打开重挂归零） ---------- */
  const toggleGlobalSwitcher = useCallback(() => {
    const n = ++swSeq.current;
    setSwitcher((sw) => (sw?.kind === "global" ? null : { kind: "global", n }));
  }, []);
  function openColumnSwitcher(vpIndex: number, btn: HTMLElement) {
    const { x, y } = anchoredPos(btn, 330, 420);
    setSwitcher({ kind: "column", vpIndex, x, y, n: ++swSeq.current });
  }
  function openSubtree(rootId: string, btn: HTMLElement) {
    const { x, y } = anchoredPos(btn, 340, 400);
    setSwitcher({ kind: "subtree", rootId, x, y, n: ++swSeq.current });
  }
  function pickRow(row: TreeRow, m: SwitcherMode) {
    setSwitcher(null);
    if (m.kind === "column") {
      if (cols.slots[m.vpIndex]?.id === row.id) {
        cols.flashThread(row.id);
        return;
      }
      cols.navColumn(m.vpIndex, row.id, "swap");
    } else if (m.kind === "subtree") {
      openBranchUI(row.id, m.rootId);
    } else {
      openBranchUI(row.id, null);
    }
  }

  /* ---------- 快捷键：⌘K 会话树 / Esc 逐层关闭（气泡 → 面板 → 抽屉） ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleGlobalSwitcher();
        return;
      }
      if (e.key === "Escape") {
        if (sel) setSel(null);
        else if (bubble && !bubble.collapsed) setBubble({ ...bubble, collapsed: true });
        else if (bubble) setBubble(null);
        else if (sheet) setSheet(null);
        else if (switcher) setSwitcher(null);
        else if (drawerOpen) setDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sel, bubble, sheet, switcher, drawerOpen, toggleGlobalSwitcher]);

  /* ---------- 主线 hint 卡片 ---------- */
  const hintNode = hintOn ? (
    <div className="hint">
      <Highlighter size={15} color="#b07d2e" />
      <div>
        <b>划选 AI 回复里的文字</b>即可开分支，列数随屏宽自适应（2–4 列）。列满后继续深入默认
        <b>替换来源列</b>（提示条可撤销），顶栏切到<b>细条⑤</b>则改为把最久未用的列折成竖直细条。
        按住 <span className="kbd">⌘</span>/Ctrl 划选开分支或点脚注 = <b>保留本列</b>
        、新会话开在紧邻右侧；气泡底部的迷你列条会预览将替换 / 折叠哪一列，点小格可改选让位目标。
        <b>拖动列间分割线可调宽度，双击恢复均分</b>。面包屑可就地回退；按{" "}
        <span className="kbd">⌘K</span> 搜会话树，点列头 <b>⇄</b>{" "}
        把该列切换成任意会话，<b>⑂</b> 查看该会话的子分支。分支里产出的 Artifact
        会从右侧抽屉弹出。顶栏可切换<b>画布视图</b>，纵览整棵会话树，双击节点回到列模式。
      </div>
      <span className="close" onClick={() => setHintOn(false)}>
        ✕
      </span>
    </div>
  ) : null;

  /* ---------- 顶栏数据 ---------- */
  const branchCount = Object.keys(state.threads).length - 1;
  const segLabel = winW === null ? "列数" : `列数 ${totalCols}${forceCols === null ? " · auto" : ""}`;

  return (
    <div className="tc">
      <div className="topbar">
        <Link className="home" href="/" title="返回 playground 首页">
          ←
        </Link>
        <div className="brand">
          <span className="mark">
            Thread<em>·</em>
          </span>
          <span className="tag">方案⑥ 自适应列 + 面包屑替换 · 优化版</span>
        </div>
        <div className="spacer" />
        <div className="seg">
          <span className="lbl" title="列 = 并排深读；画布 = 纵览整棵会话树">
            视图
          </span>
          <button
            className={`mode ${viewMode === "columns" ? "on" : ""}`}
            title="列视图：并排深读多个会话"
            onClick={() => setViewMode("columns")}
          >
            <Columns3 size={12} />列
          </button>
          <button
            className={`mode ${viewMode === "canvas" ? "on" : ""}`}
            title="画布视图：纵览整棵会话树，双击节点回到列模式"
            onClick={() => setViewMode("canvas")}
          >
            <Waypoints size={12} />
            画布
          </button>
        </div>
        {viewMode === "columns" && (
          <>
            <div className="seg">
              <span
                className="lbl"
                title={winW === null ? undefined : `视口 ${winW}px，约每 ${COL_MIN_W}px 一列`}
              >
                {segLabel}
              </span>
              {(["auto", 2, 3, 4] as const).map((v) => (
                <button
                  key={v}
                  className={(v === "auto" ? forceCols === null : forceCols === v) ? "on" : ""}
                  onClick={() => setForceCols(v === "auto" ? null : v)}
                >
                  {v === "auto" ? "自适应" : v}
                </button>
              ))}
            </div>
            <div className="seg">
              <span className="lbl" title="列满时的放置策略">
                列满
              </span>
              <button
                className={mode === "replace" ? "on" : ""}
                onClick={() => changeMode("replace")}
              >
                替换⑥
              </button>
              <button className={mode === "fold" ? "on" : ""} onClick={() => changeMode("fold")}>
                细条⑤
              </button>
            </div>
          </>
        )}
        <button className="tbtn" title="搜索并打开任意会话（⌘K）" onClick={toggleGlobalSwitcher}>
          <Network size={13} />
          会话树{branchCount > 0 ? ` · ${branchCount}` : ""}
          <span className="kbd">⌘K</span>
        </button>
        <button
          className="tbtn"
          title="打开 / 收起 Artifact 抽屉"
          onClick={() => setDrawerOpen((v) => !v)}
        >
          <PanelRightOpen size={13} />
          Artifact
          <span className="cnt">{state.artifactOrder.length}</span>
        </button>
        <button
          className="tbtn"
          title="清除本地保存的会话树，回到演示种子"
          onClick={() => {
            try {
              localStorage.removeItem(PERSIST_KEY);
            } catch {
              /* 不可用则直接刷新 */
            }
            location.reload();
          }}
        >
          <RotateCcw size={13} />
          重置
        </button>
        <span className="demo-pill" title={llmModel ? `回复由 ${llmModel} 实时生成` : "未配置模型 key，回复为演示内容"}>
          {llmModel ? `${llmModel} 流式` : "mock 流式回复"}
        </span>
      </div>

      {viewMode === "columns" ? (
        <ThreadColumns
          state={state}
          slots={cols.slots}
          widths={cols.widths}
          flashId={cols.flashId}
          colsRef={cols.colsRef}
          onExpandStrip={(id) => openBranchUI(id, null)}
          onCommitWidths={cols.commitWidths}
          onResetWidths={cols.resetWidths}
          renderThread={(threadId, vpIndex) => (
            <BranchableChat
              state={state}
              threadId={threadId}
              subtitle={threadId === "main" ? MAIN_SUBTITLE : undefined}
              intro={threadId === "main" ? hintNode : undefined}
              onOpenThread={(target, opts) => openBranchUI(target, threadId, opts)}
              onOpenArtifact={(aid) => {
                setActiveArt(aid);
                setDrawerOpen(true);
              }}
              onCrumbNav={(target) => cols.navColumn(vpIndex, target, "collapse")}
              onOpenSwitcher={(btn) => openColumnSwitcher(vpIndex, btn)}
              onOpenSubtree={(btn) => openSubtree(threadId, btn)}
              onCollapse={() => cols.closeColumn(vpIndex)}
              onSend={(text) => store.send(threadId, text)}
              onRetry={(msgId) => store.retryReply(threadId, msgId)}
            />
          )}
        />
      ) : (
        <ThreadCanvas
          store={store}
          mainSubtitle={MAIN_SUBTITLE}
          viewState={canvasViewState}
          onOpenThread={(id) => openBranchUI(id, null)}
          focusNode={canvasFocus}
          onOpenSheet={isMobile ? (id) => setSheet({ threadId: id, full: false }) : undefined}
        />
      )}

      {/* 移动端 bottom sheet：画布节点单击唤起的会话视口（半屏 ⇄ 拉满） */}
      {sheet && (
        <ThreadSheet
          state={state}
          threadId={sheet.threadId}
          full={sheet.full}
          onFullChange={(full) => setSheet((s) => (s ? { ...s, full } : s))}
          onClose={() => setSheet(null)}
          onSend={(text) => store.send(sheet.threadId, text)}
          onRetry={(msgId) => store.retryReply(sheet.threadId, msgId)}
        />
      )}

      {/* 划选气泡两种模式都挂载（Phase 2 画布内划选走展开节点的消息列表，共用
          同一 DOM 契约）。列槽上下文只在列模式喂给迷你列条（画布 fork 不占列槽）；
          轻对话（onStartBubble）仅列模式提供——画布里带问 Enter 落到 handleFork，
          直接长成带首问的新节点 */}
      <SelectionBubble
        state={state}
        sel={sel}
        onSelChange={setSel}
        onFork={handleFork}
        onStartBubble={viewMode === "columns" ? handleStartBubble : undefined}
        slots={viewMode === "columns" ? cols.slots : []}
        mode={mode}
        maxExpanded={maxExpanded}
        lastActiveOf={(id) => state.threads[id]?.lastActive ?? 0}
      />

      {/* 气泡轻对话视口（列模式专属：锚定在原文 .anchored 上；徽标态贴右缘） */}
      {viewMode === "columns" && bubble && (
        <BubbleThread
          state={state}
          threadId={bubble.threadId}
          collapsed={bubble.collapsed}
          onCollapsedChange={(c) => setBubble((b) => (b ? { ...b, collapsed: c } : b))}
          onSend={(text) => store.send(bubble.threadId, text)}
          onRetry={(msgId) => store.retryReply(bubble.threadId, msgId)}
          onUpgrade={upgradeBubble}
        />
      )}

      {switcher && (
        <ThreadSwitcher
          key={switcher.n}
          state={state}
          mode={switcher}
          slots={cols.slots}
          recents={state.recents}
          onPick={pickRow}
          onClose={() => setSwitcher(null)}
        />
      )}

      <ArtifactDrawer
        state={state}
        open={drawerOpen}
        activeId={activeArt}
        onClose={() => setDrawerOpen(false)}
        onSelect={setActiveArt}
        onLocate={(threadId) => openBranchUI(threadId, null)}
      />

      <div className={`toast ${toast ? "show" : ""}`}>
        <span>{toast?.msg}</span>
        {toast?.undo && (
          <button
            className="undo"
            onClick={() => {
              toast.undo?.();
              setToast(null);
            }}
          >
            撤销
          </button>
        )}
      </div>
    </div>
  );
}
