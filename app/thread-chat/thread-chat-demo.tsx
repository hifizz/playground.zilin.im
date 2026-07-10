"use client";
/* eslint-disable react-hooks/refs, react-hooks/immutability, react-hooks/set-state-in-effect --
   本 demo 从命令式原型（vanilla JS）移植：会话树 store 采用「稳定对象 + 原地修改 + force 重渲」
   模型，配合大量基于 DOM Selection / dataset 的划选交互。React Compiler 系列规则与该模型冲突，
   属于有意为之的取舍，非疏漏。 */

import Link from "next/link";
import React, { useEffect, useReducer, useRef, useState } from "react";
import {
  FileCode2,
  FileText,
  GitFork,
  Highlighter,
  LocateFixed,
  Network,
  PanelRightOpen,
  Search,
  X,
} from "lucide-react";
import "./thread-chat.css";
import {
  artifactSeedFor,
  cannedIntro,
  cannedReply,
  seedStore,
  type Artifact,
  type Branch,
  type Fork,
  type Message,
  type Store,
} from "./data";

/**
 * --------------------------------------------------------------------------
 * Thread Chat · 方案⑥「自适应列 + 面包屑替换」优化版
 * --------------------------------------------------------------------------
 * 相对原型 HTML 的三处改动：
 *
 * 1.「指定打开某一个会话」——原型只有一个藏在按钮后的分支地图弹窗，且列满时
 *    固定替换最右列，用户无法控制会话出现在哪。优化为三层入口：
 *    · ⌘K 全局会话树：可搜索、带最近访问、键盘上下选中回车打开；
 *    · 每列头部 ⇄ 切换器：把「这一列」就地切换成任意会话（指定打开位置）；
 *    · 列满替换改为「替换来源列，无来源则替换最久未使用列」，并在 toast
 *      里提供一键撤销。
 * 2. 移除「带回主线」（按钮 / summary 消息 / 相关文案），按需求后置。
 * 3. 新增 Artifact 右侧抽屉舞台：全局唯一、标签页管理、深度色圆点标来源，
 *    支持从 artifact 反向定位回来源会话。
 * --------------------------------------------------------------------------
 */

/* ---------------- 深度配色 ---------------- */
const dc = (d: number) => ((d - 1) % 5) + 1;
const dvar = (d: number) => `var(--d${dc(d)})`;
const accentOf = (b: Branch) => (b.depth === 0 ? "var(--d1)" : dvar(b.depth));
const dotColorOf = (b: Branch) => (b.depth === 0 ? "#8a8377" : dvar(b.depth));

const COL_MIN_W = 430; // 约每 430px 一列

/* ---------------- 划选锚点 → 高亮区间 ---------------- */
interface Range_ {
  start: number;
  end: number;
  fork: Fork;
}
function computeRanges(msg: Message): Range_[] {
  const t = msg.text;
  const ranges: Range_[] = [];
  msg.forks.forEach((f) => {
    let i = t.indexOf(f.text);
    while (i !== -1 && ranges.some((r) => !(i + f.text.length <= r.start || i >= r.end)))
      i = t.indexOf(f.text, i + 1);
    if (i !== -1) ranges.push({ start: i, end: i + f.text.length, fork: f });
  });
  ranges.sort((a, b) => a.start - b.start);
  return ranges;
}

function withBreaks(s: string, keyBase: string): React.ReactNode[] {
  const lines = s.split("\n");
  const out: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) out.push(<br key={`${keyBase}-br${i}`} />);
    if (line) out.push(line);
  });
  return out;
}

/* ---------------- 状态类型 ---------------- */
interface SelState {
  text: string;
  branchId: string;
  msgId: string;
  x: number;
  y: number;
}
type SwitcherState = { kind: "global" } | { kind: "column"; vpIndex: number; x: number; y: number };
interface ToastState {
  msg: string;
  undo?: () => void;
  n: number;
}
interface FlashState {
  id: string;
  n: number;
}
interface SwxRow {
  id: string;
  depth: number;
  isMain: boolean;
  title: string;
  footnote: number | null;
  anchor: string | null;
}

export function ThreadChatDemo() {
  /* ---------- 可变数据仓库（沿用原型的命令式模型，对象身份稳定，force 触发重渲）---------- */
  const [store] = useState<Store>(seedStore);
  const [, force] = useReducer((x: number) => x + 1, 0);

  const [viewports, setViewports] = useState<string[]>([]);

  const [winW, setWinW] = useState<number | null>(null);
  const [forceCols, setForceCols] = useState<number | null>(null);
  const [hintOn, setHintOn] = useState(true);

  const [sel, setSel] = useState<SelState | null>(null);
  const [switcher, setSwitcher] = useState<SwitcherState | null>(null);
  const [query, setQuery] = useState("");
  const [hi, setHi] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeArt, setActiveArt] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastSeq = useRef(0);
  const [flash, setFlash] = useState<FlashState | null>(null);
  const flashSeq = useRef(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const taRefs = useRef(new Map<string, HTMLTextAreaElement>());

  /* ---------- 自适应列数 ---------- */
  const autoCols = winW === null ? 3 : Math.max(2, Math.min(4, Math.floor(winW / COL_MIN_W)));
  const totalCols = forceCols ?? autoCols;
  const maxVp = totalCols - 1;

  useEffect(() => {
    const update = () => setWinW(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // 列数缩小时，从左侧裁掉最早打开的列（主线永远保留）
  useEffect(() => {
    setViewports((v) => (v.length > maxVp ? v.slice(v.length - maxVp) : v));
  }, [maxVp]);

  /* ---------- 基础工具 ---------- */
  const bTitle = (id: string) => store.branches[id]?.title ?? id;

  function touch(id: string) {
    store.tick++;
    const b = store.branches[id];
    if (b) b.lastActive = store.tick;
    if (id !== "main") setRecents((r) => [id, ...r.filter((x) => x !== id)].slice(0, 6));
  }

  function doFlash(id: string) {
    setFlash({ id, n: ++flashSeq.current });
  }
  useEffect(() => {
    if (!flash) return;
    const el = rootRef.current?.querySelector(`.column[data-branch-id="${flash.id}"]`);
    el?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
    const t = setTimeout(() => setFlash(null), 950);
    return () => clearTimeout(t);
  }, [flash]);

  function showToast(msg: string, undo?: () => void) {
    setToast({ msg, undo, n: ++toastSeq.current });
  }
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.undo ? 5200 : 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- 打开 / 放置 / 导航 ---------- */
  function lruIndex(vps: string[]) {
    let idx = 0;
    let min = Infinity;
    vps.forEach((vid, i) => {
      const la = store.branches[vid]?.lastActive ?? 0;
      if (la < min) {
        min = la;
        idx = i;
      }
    });
    return idx;
  }

  type Placement =
    | { kind: "visible" }
    | { kind: "appended" }
    | { kind: "replaced"; idx: number; replacedId: string; prev: string[] };

  /** 把分支放进某一列：已显示→闪烁；有空位→追加；列满→替换来源列或最久未用列 */
  function placeBranch(id: string, sourceBranchId?: string | null): Placement {
    touch(id);
    const vps = viewports;
    if (vps.indexOf(id) >= 0) {
      doFlash(id);
      force();
      return { kind: "visible" };
    }
    if (vps.length < totalCols - 1) {
      setViewports([...vps, id]);
      doFlash(id);
      force();
      return { kind: "appended" };
    }
    let idx = sourceBranchId ? vps.indexOf(sourceBranchId) : -1;
    if (idx < 0) idx = lruIndex(vps);
    const prev = [...vps];
    const replacedId = vps[idx];
    const next = [...vps];
    next[idx] = id;
    setViewports(next);
    doFlash(id);
    force();
    return { kind: "replaced", idx, replacedId, prev };
  }

  /** 统一入口：脚注 / 会话树 / artifact 定位都走这里 */
  function openBranchUI(id: string, sourceBranchId?: string | null) {
    if (id === "main") {
      doFlash("main");
      return;
    }
    const r = placeBranch(id, sourceBranchId);
    if (r.kind === "replaced") {
      showToast(`第 ${r.idx + 2} 列已替换：「${bTitle(r.replacedId)}」→「${bTitle(id)}」`, () => {
        setViewports(r.prev);
        doFlash(r.replacedId);
      });
    }
  }

  /** 列内导航（面包屑=collapse：目标已在别列时收起本列；切换器=swap：交换两列） */
  function navViewport(vpIndex: number, targetId: string, dup: "collapse" | "swap" = "collapse") {
    const vps = viewports;
    if (targetId === "main") {
      const next = [...vps];
      next.splice(vpIndex, 1);
      setViewports(next);
      doFlash("main");
      return;
    }
    touch(targetId);
    const other = vps.indexOf(targetId);
    const next = [...vps];
    if (other >= 0 && other !== vpIndex) {
      if (dup === "swap") {
        next[other] = next[vpIndex];
        next[vpIndex] = targetId;
      } else {
        next.splice(vpIndex, 1);
      }
    } else {
      next[vpIndex] = targetId;
    }
    setViewports(next);
    doFlash(targetId);
    force();
  }

  function closeViewport(vpIndex: number) {
    const next = [...viewports];
    next.splice(vpIndex, 1);
    setViewports(next);
  }

  /* ---------- 开分支 / 发消息 ---------- */
  function createBranch(text: string, srcBranchId: string, srcMsgId: string) {
    const parent = store.branches[srcBranchId];
    if (!parent) return;
    const srcMsg = parent.messages.find((m) => m.id === srcMsgId);
    if (!srcMsg) return;

    store.footnoteCounter++;
    const id = "b" + store.seq++;
    const depth = parent.depth + 1;
    const title = text.length > 13 ? text.slice(0, 13) + "…" : text;

    const seed = artifactSeedFor(text);
    let artId: string | null = null;
    if (seed) {
      artId = "a" + store.seq++;
      store.artifacts[artId] = { id: artId, sourceBranchId: id, ...seed };
      store.artifactOrder.push(artId);
    }

    store.branches[id] = {
      id,
      parentId: srcBranchId,
      depth,
      anchorText: text,
      forkFromMsgId: srcMsgId,
      title,
      footnote: store.footnoteCounter,
      children: [],
      messages: [
        {
          id: "m" + store.seq++,
          role: "assistant",
          text: cannedIntro(text),
          forks: [],
          artifactIds: artId ? [artId] : undefined,
        },
      ],
      lastActive: 0,
    };
    parent.children.push(id);
    srcMsg.forks.push({ text, num: store.footnoteCounter, branchId: id, depth });

    const r = placeBranch(id, srcBranchId);
    if (artId) {
      setActiveArt(artId);
      setDrawerOpen(true);
    }
    if (r.kind === "replaced") {
      showToast(`已开启分支「${title}」，替换了第 ${r.idx + 2} 列的「${bTitle(r.replacedId)}」`, () => {
        setViewports(r.prev);
        doFlash(r.replacedId);
      });
    } else {
      showToast(`已开启分支 · ${title}${artId ? "（Artifact 已在右侧打开）" : ""}`);
    }
  }

  function sendMessage(branchId: string, text: string) {
    const b = store.branches[branchId];
    if (!b) return;
    b.messages.push({ id: "m" + store.seq++, role: "user", text, forks: [] });
    b.messages.push({ id: "m" + store.seq++, role: "assistant", text: cannedReply(), forks: [] });
    touch(branchId);
    force();
    requestAnimationFrame(() => {
      const el = rootRef.current?.querySelector(`.msg-list[data-list="${branchId}"]`);
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  function doSend(branchId: string) {
    const ta = taRefs.current.get(branchId);
    if (!ta) return;
    const v = ta.value.trim();
    if (!v) return;
    ta.value = "";
    ta.style.height = "auto";
    sendMessage(branchId, v);
    ta.focus();
  }

  const autoGrow = (ta: HTMLTextAreaElement) => {
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  /* ---------- Artifact ---------- */
  function openArtifact(id: string) {
    setActiveArt(id);
    setDrawerOpen(true);
  }
  const activeArtifact: Artifact | null =
    (activeArt && store.artifacts[activeArt]) || store.artifacts[store.artifactOrder[0]] || null;

  /* ---------- 划选 → 迷你气泡 ---------- */
  useEffect(() => {
    const onMouseUp = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.(".sel-bubble")) return;
      setTimeout(() => {
        const s = window.getSelection();
        const txt = s?.toString().trim() ?? "";
        if (!s || !txt || txt.length < 2) {
          setSel(null);
          return;
        }
        const node = s.anchorNode;
        if (!node) return;
        const base = node.nodeType === Node.TEXT_NODE ? (node as Text).parentElement : (node as HTMLElement);
        const host = base?.closest?.('.bubble[data-role="assistant"]');
        if (!host) {
          setSel(null);
          return;
        }
        const listEl = host.closest(".msg-list") as HTMLElement | null;
        const msgEl = host.closest(".message") as HTMLElement | null;
        const branchId = listEl?.dataset.list;
        const msgId = msgEl?.dataset.msgId;
        if (!branchId || !msgId) return;
        const msg = store.branches[branchId]?.messages.find((m) => m.id === msgId);
        if (!msg || msg.text.indexOf(txt) === -1) {
          setSel(null);
          return;
        }
        const rect = s.getRangeAt(0).getBoundingClientRect();
        const left = Math.max(10, Math.min(rect.left, window.innerWidth - 244));
        let top = rect.bottom + 9;
        if (top > window.innerHeight - 150) top = Math.max(10, rect.top - 132);
        setSel({ text: txt, branchId, msgId, x: left, y: top });
      }, 10);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest?.(".sel-bubble")) setSel(null);
    };
    const onScroll = () => setSel(null);
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
  }, [store]);

  /* ---------- 快捷键：⌘K 会话树 / Esc 逐层关闭 ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuery("");
        setHi(0);
        setSwitcher((sw) => (sw?.kind === "global" ? null : { kind: "global" }));
        return;
      }
      if (e.key === "Escape") {
        if (sel) setSel(null);
        else if (switcher) setSwitcher(null);
        else if (drawerOpen) setDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sel, switcher, drawerOpen]);

  /* ---------- 会话树数据 ---------- */
  function buildRows(): SwxRow[] {
    const rows: SwxRow[] = [];
    const walk = (id: string) => {
      const b = store.branches[id];
      if (!b) return;
      rows.push({
        id,
        depth: b.depth,
        isMain: id === "main",
        title: b.title,
        footnote: b.footnote,
        anchor: b.anchorText,
      });
      b.children.forEach(walk);
    };
    walk("main");
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.title.toLowerCase().includes(q) || (r.anchor ?? "").toLowerCase().includes(q),
    );
  }
  const rows = switcher ? buildRows() : [];
  const filtering = query.trim().length > 0;

  useEffect(() => {
    if (!switcher) return;
    rootRef.current?.querySelector(`[data-swxrow="${hi}"]`)?.scrollIntoView({ block: "nearest" });
  }, [hi, switcher]);

  function activateRow(row: SwxRow | undefined) {
    const sw = switcher;
    if (!sw || !row) return;
    setSwitcher(null);
    if (sw.kind === "column") {
      if (viewports[sw.vpIndex] === row.id) {
        doFlash(row.id);
        return;
      }
      navViewport(sw.vpIndex, row.id, "swap");
    } else {
      openBranchUI(row.id, null);
    }
  }

  function openColumnSwitcher(vpIndex: number, btn: HTMLElement) {
    const rect = btn.getBoundingClientRect();
    const x = Math.max(8, Math.min(rect.right - 330, window.innerWidth - 338));
    let y = rect.bottom + 6;
    if (y + 420 > window.innerHeight) y = Math.max(8, window.innerHeight - 430);
    setQuery("");
    setHi(0);
    setSwitcher({ kind: "column", vpIndex, x, y });
  }

  const statusOf = (id: string): { label: string; on: boolean } | null => {
    if (id === "main") return { label: "锚定", on: true };
    const i = viewports.indexOf(id);
    if (i >= 0) return { label: `第 ${i + 2} 列`, on: true };
    return null;
  };

  /* ---------- 渲染：消息 ---------- */
  function renderAssistantBody(msg: Message, columnId: string) {
    const ranges = computeRanges(msg);
    const t = msg.text;
    const paras: { start: number; text: string }[] = [];
    let off = 0;
    t.split("\n\n").forEach((pt) => {
      paras.push({ start: off, text: pt });
      off += pt.length + 2;
    });

    return paras.map((p) => {
      const pEnd = p.start + p.text.length;
      const nodes: React.ReactNode[] = [];
      let pos = p.start;
      ranges.forEach((r, ri) => {
        if (r.end <= p.start || r.start >= pEnd) return;
        const s0 = Math.max(r.start, p.start);
        const e0 = Math.min(r.end, pEnd);
        if (s0 > pos) nodes.push(...withBreaks(t.slice(pos, s0), `t${pos}`));
        nodes.push(
          <span
            key={`a${ri}-${s0}`}
            className={`anchored fc-${dc(r.fork.depth)}`}
            title={`分支「${bTitle(r.fork.branchId)}」· 点击打开`}
            onClick={() => openBranchUI(r.fork.branchId, columnId)}
          >
            {withBreaks(t.slice(s0, e0), `at${s0}`)}
          </span>,
        );
        if (r.end <= pEnd)
          nodes.push(
            <sup
              key={`f${ri}`}
              className={`fnote fc-${dc(r.fork.depth)}`}
              title={`分支「${bTitle(r.fork.branchId)}」· 点击打开`}
              onClick={() => openBranchUI(r.fork.branchId, columnId)}
            >
              {r.fork.num}
            </sup>,
          );
        pos = e0;
      });
      if (pos < pEnd) nodes.push(...withBreaks(t.slice(pos, pEnd), `t${pos}`));
      return <p key={p.start}>{nodes}</p>;
    });
  }

  function renderArtifactCards(msg: Message) {
    if (!msg.artifactIds?.length) return null;
    return msg.artifactIds.map((aid) => {
      const a = store.artifacts[aid];
      if (!a) return null;
      const src = store.branches[a.sourceBranchId];
      const cls = src && src.depth > 0 ? `fc-${dc(src.depth)}` : "";
      return (
        <button key={aid} className={`acard ${cls}`} onClick={() => openArtifact(aid)}>
          <span className="ic">
            {a.kind === "code" ? <FileCode2 size={15} /> : <FileText size={15} />}
          </span>
          <span className="t">
            <span className="n" style={{ display: "block" }}>
              {a.title}
            </span>
            <span className="k" style={{ display: "block" }}>
              ARTIFACT · {a.kind === "code" ? (a.lang ?? "code") : "note"}
            </span>
          </span>
          <span className="go">抽屉打开 →</span>
        </button>
      );
    });
  }

  function renderMessage(msg: Message, columnId: string) {
    return (
      <div key={msg.id} className={`message ${msg.role}`} data-msg-id={msg.id}>
        <div className="who">{msg.role === "user" ? "你" : "AI"}</div>
        {msg.role === "user" ? (
          <div className="bubble" data-role="user">
            {msg.text}
          </div>
        ) : (
          <>
            <div className="bubble" data-role="assistant">
              {renderAssistantBody(msg, columnId)}
            </div>
            {renderArtifactCards(msg)}
          </>
        )}
      </div>
    );
  }

  /* ---------- 渲染：列 ---------- */
  function lineage(id: string): Branch[] {
    const chain: Branch[] = [];
    let cur: Branch | undefined = store.branches[id];
    while (cur) {
      chain.unshift(cur);
      cur = cur.parentId ? store.branches[cur.parentId] : undefined;
    }
    return chain;
  }

  function collectInherited(b: Branch): Message[] {
    if (!b.parentId) return [];
    const p = store.branches[b.parentId];
    if (!p) return [];
    const i = p.messages.findIndex((m) => m.id === b.forkFromMsgId);
    const upto = p.messages.slice(0, i + 1);
    return p.parentId === null ? upto : [...collectInherited(p), ...upto];
  }

  function renderComposer(id: string, isMain: boolean) {
    return (
      <div className={`composer ${isMain ? "" : "branch"}`}>
        <div className="box">
          <textarea
            rows={1}
            placeholder={isMain ? "继续在主线提问…" : "在这个分支里追问…"}
            ref={(el) => {
              if (el) taRefs.current.set(id, el);
              else taRefs.current.delete(id);
            }}
            onInput={(e) => autoGrow(e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                doSend(id);
              }
            }}
          />
          <button className="send" onClick={() => doSend(id)}>
            发送
          </button>
        </div>
      </div>
    );
  }

  function renderColumn(id: string, vpIndex: number) {
    const b = store.branches[id];
    if (!b) return null;
    const isMain = id === "main";
    const accent = accentOf(b);
    const chain = isMain ? [] : lineage(id);
    const inherited = isMain ? [] : collectInherited(b);

    return (
      <div
        key={id}
        className={`column ${isMain ? "main" : "branch"} ${flash?.id === id ? "flash" : ""}`}
        data-branch-id={id}
        style={{ "--accent": accent } as React.CSSProperties}
      >
        <div className="col-head">
          {isMain ? (
            <>
              <div className="ctitle-row">
                <span className="anchor-tag">锚定</span>
                <span className="ctitle main">主线</span>
              </div>
              <div className="col-sub">一段关于 Agent 记忆系统的对话</div>
            </>
          ) : (
            <>
              <div className="crumb">
                {chain.map((c, i) => {
                  const here = i === chain.length - 1;
                  return (
                    <React.Fragment key={c.id}>
                      <span
                        className={here ? "here" : "seg2"}
                        onClick={here ? undefined : () => navViewport(vpIndex, c.id, "collapse")}
                        title={here ? undefined : `回到「${c.title}」`}
                      >
                        {c.title}
                      </span>
                      {!here && <span className="chev">›</span>}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="ctitle-row">
                <span className="depth-badge">L{b.depth}</span>
                <span className="ctitle">{b.title}</span>
                <div className="cactions">
                  <button
                    className="cbtn"
                    title="把本列切换为任意会话"
                    onClick={(e) => openColumnSwitcher(vpIndex, e.currentTarget)}
                  >
                    ⇄ 切换
                  </button>
                  <button className="cbtn" title="收起本列" onClick={() => closeViewport(vpIndex)}>
                    收起
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {!isMain && (
          <div className="focus-banner">
            <span className="fn">{b.footnote}</span>
            <div className="ft">
              <span className="lbl">
                讨论焦点 · 划选自
                {b.parentId === "main" ? "主线" : `「${bTitle(b.parentId!)}」`}
              </span>
              <q>{b.anchorText}</q>
            </div>
          </div>
        )}

        {!isMain && (
          <details className="inherited">
            <summary>
              <span className="tw">▸</span>继承的上文 · {inherited.length} 条
            </summary>
            <div className="inherited-body">
              {inherited.map((m) => (
                <div key={m.id} className="inh-msg">
                  <span className="who">{m.role === "user" ? "你" : "AI"}</span>
                  {m.text.length > 130 ? m.text.slice(0, 130) + "…" : m.text}
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="msg-list" data-list={id}>
          {isMain && hintOn && (
            <div className="hint">
              <Highlighter size={15} color="#b07d2e" />
              <div>
                <b>划选 AI 回复里的文字</b>即可开分支，列数随屏宽自适应（2–4 列）。列满后继续深入会
                <b>替换来源列</b>，面包屑可就地回退，替换可在提示条里撤销。想直接打开某个会话：按{" "}
                <span className="kbd">⌘K</span> 搜会话树，或点分支列标题旁的 <b>⇄</b>{" "}
                把该列切换成任意会话。分支里产出的 Artifact 会从右侧抽屉弹出。
              </div>
              <span className="close" onClick={() => setHintOn(false)}>
                ✕
              </span>
            </div>
          )}
          {b.messages.map((m) => renderMessage(m, id))}
        </div>

        {renderComposer(id, isMain)}
      </div>
    );
  }

  /* ---------- 渲染：会话切换器 ---------- */
  function renderSwitcher() {
    if (!switcher) return null;
    const isGlobal = switcher.kind === "global";
    const curColBranch = !isGlobal ? viewports[switcher.vpIndex] : null;
    const recentRows = isGlobal && !filtering ? recents.filter((id) => store.branches[id]).slice(0, 5) : [];

    return (
      <>
        <div
          className={`swx-scrim ${isGlobal ? "" : "clear"}`}
          onMouseDown={() => setSwitcher(null)}
        />
        <div
          className={`swx ${isGlobal ? "global" : "local"}`}
          style={isGlobal ? undefined : { left: switcher.x, top: switcher.y }}
        >
          <div className="swx-search">
            <Search size={14} />
            <input
              autoFocus
              value={query}
              placeholder={isGlobal ? "搜索会话（标题 / 划选原文）…" : "把本列切换为…"}
              onChange={(e) => {
                setQuery(e.target.value);
                setHi(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHi((h) => Math.min(h + 1, rows.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHi((h) => Math.max(h - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  activateRow(rows[hi]);
                }
              }}
            />
            {isGlobal && <span className="kbd">⌘K</span>}
          </div>

          {recentRows.length > 0 && (
            <>
              <div className="swx-hd">最近访问</div>
              <div className="swx-recent">
                {recentRows.map((id) => {
                  const rb = store.branches[id];
                  return (
                    <button
                      key={id}
                      className="swx-chip"
                      style={{ "--dc": dotColorOf(rb) } as React.CSSProperties}
                      onClick={() => {
                        setSwitcher(null);
                        openBranchUI(id, null);
                      }}
                    >
                      <span className="dot" />
                      <span className="tt">{rb.title}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="swx-list">
            {rows.length === 0 && <div className="swx-empty">没有匹配「{query}」的会话</div>}
            {rows.map((r, i) => {
              const st = statusOf(r.id);
              const isCur = curColBranch === r.id;
              return (
                <div
                  key={r.id}
                  data-swxrow={i}
                  className={`swx-row ${i === hi ? "hi" : ""}`}
                  style={
                    {
                      "--dc": r.isMain ? "#8a8377" : dvar(r.depth),
                      paddingLeft: filtering ? 9 : 9 + r.depth * 16,
                    } as React.CSSProperties
                  }
                  title={r.anchor ? `划选自：「${r.anchor}」` : undefined}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => activateRow(r)}
                >
                  <span className="dot" />
                  {r.footnote !== null && <span className="n">{r.footnote}</span>}
                  <span className={`t ${r.isMain ? "main" : ""}`}>{r.title}</span>
                  {r.anchor && filtering && <span className="anch">「{r.anchor}」</span>}
                  {isCur ? (
                    <span className="st">本列</span>
                  ) : st ? (
                    <span className="st">{st.label}</span>
                  ) : !isGlobal && r.isMain ? (
                    <span className="st">⇐ 收起本列</span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="swx-foot">
            <span>↑↓ 选择</span>
            <span>⏎ 打开</span>
            <span>esc 关闭</span>
            {isGlobal ? <span>点击 = 智能放置（列满替换最久未用列）</span> : <span>点击 = 在本列打开</span>}
          </div>
        </div>
      </>
    );
  }

  /* ---------- 渲染：Artifact 抽屉 ---------- */
  function renderDrawer() {
    const a = activeArtifact;
    const src = a ? store.branches[a.sourceBranchId] : null;
    return (
      <div className={`art-drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen}>
        <div className="art-head">
          <PanelRightOpen size={16} color="#6a6357" />
          <h3>
            Artifact 舞台 <span className="sub">全局唯一 · 标签页管理</span>
          </h3>
          <button className="art-x" title="收起抽屉" onClick={() => setDrawerOpen(false)}>
            <X size={13} />
          </button>
        </div>
        {store.artifactOrder.length > 0 && (
          <div className="art-tabs">
            {store.artifactOrder.map((aid) => {
              const art = store.artifacts[aid];
              if (!art) return null;
              const sb = store.branches[art.sourceBranchId];
              return (
                <button
                  key={aid}
                  className={`art-tab ${a?.id === aid ? "on" : ""}`}
                  style={{ "--dc": sb ? dotColorOf(sb) : "#8a8377" } as React.CSSProperties}
                  title={`来自「${sb?.title ?? "?"}」`}
                  onClick={() => setActiveArt(aid)}
                >
                  <span className="dot" />
                  {art.title}
                </button>
              );
            })}
          </div>
        )}
        <div className="art-body">
          {!a && <div className="art-empty">还没有 Artifact——在主线或分支里生成后会出现在这里。</div>}
          {a && a.kind === "code" && <pre className="art-code">{a.content}</pre>}
          {a && a.kind === "note" && (
            <div className="art-note">
              {a.content.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </div>
        {a && src && (
          <div className="art-src" style={{ "--dc": dotColorOf(src) } as React.CSSProperties}>
            <span className="dot" />
            <span className="nm">
              来源会话：{src.title}
              {src.footnote !== null ? ` · 脚注 ${src.footnote}` : ""}
            </span>
            <button
              className="loc"
              title="打开产生这个 Artifact 的会话"
              onClick={() => openBranchUI(src.id, null)}
            >
              <LocateFixed size={11} style={{ verticalAlign: "-1px", marginRight: 4 }} />
              定位来源会话
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ---------- 顶栏 ---------- */
  const branchCount = Object.keys(store.branches).length - 1;
  const segLabel = winW === null ? "列数" : `列数 ${totalCols}${forceCols === null ? " · auto" : ""}`;

  return (
    <div className="tc" ref={rootRef}>
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
          <span className="lbl" title={winW === null ? undefined : `视口 ${winW}px，约每 ${COL_MIN_W}px 一列`}>
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
        <button
          className="tbtn"
          title="搜索并打开任意会话（⌘K）"
          onClick={() => {
            setQuery("");
            setHi(0);
            setSwitcher((sw) => (sw?.kind === "global" ? null : { kind: "global" }));
          }}
        >
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
          <span className="cnt">{store.artifactOrder.length}</span>
        </button>
        <span className="demo-pill">回复写死</span>
      </div>

      <div className="cols">
        {renderColumn("main", -1)}
        {viewports.map((id, i) => renderColumn(id, i))}
      </div>

      {sel && (
        <div className="sel-bubble" style={{ left: sel.x, top: sel.y }}>
          <div className="lbl">在新分支中讨论这段</div>
          <div className="quote">{sel.text}</div>
          <button
            onClick={() => {
              const { text, branchId, msgId } = sel;
              window.getSelection()?.removeAllRanges();
              setSel(null);
              createBranch(text, branchId, msgId);
            }}
          >
            <GitFork size={14} />
            开启分支讨论
          </button>
        </div>
      )}

      {renderSwitcher()}
      {renderDrawer()}

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
