"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Highlighter, RotateCcw, Sparkles } from "lucide-react";
import {
  clearHighlights,
  describeRange,
  getRootText,
  locateAnchor,
  paintRange,
  rangeFromOffsets,
  type LocateStrategy,
  type TextAnchor,
} from "./anchor";

/**
 * ============================================================================
 * Highlight Recovery · 研究页
 * ============================================================================
 * 「保存一段网页高亮，等页面重渲染 / 空白重排 / 内容被编辑之后，还能把它找回来。」
 *
 * 算法见 ./anchor-core.ts（纯字符串三层降级：position → exact → fuzzy）与
 * ./anchor.ts（Range ↔ 偏移的 DOM 胶水）。抽象自 chat-aside 浏览器插件的
 * Mark & Note 高亮恢复。
 *
 * 玩法：在下方文档里划词 → 存为高亮 → 点各种「页面漂移」按钮打乱文档 →
 * 点「恢复高亮」看每条锚点用哪一层命中（position / exact / fuzzy / 丢失）。
 * ============================================================================
 */

/* -------------------------------------------------------------------------- */
/* 文档模型                                                                     */
/* -------------------------------------------------------------------------- */

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const ORIGINAL: Message[] = [
  {
    id: "m1",
    role: "user",
    text: "How does retrieval augmented generation actually keep an LLM factual?",
  },
  {
    id: "m2",
    role: "assistant",
    text:
      "Retrieval augmented generation grounds the model in real documents: before answering, it fetches relevant passages and feeds them into the prompt as context.\n" +
      "So instead of relying on frozen weights, the model quotes fresh source material — which is exactly why the citations line up with reality.",
  },
  {
    id: "m3",
    role: "user",
    text: "And if the page text shifts around later, how do you find a saved highlight again?",
  },
  {
    id: "m4",
    role: "assistant",
    text:
      "You store a text anchor, not a DOM path. Fuzzy matching survives minor edits to the source text: first try the exact quote with `prefix`/`suffix` context, then fall back to approximate substring search when a few words changed.\n" +
      "Because the anchor is plain text plus offsets, it keeps working even after the whole component re-renders.",
  },
];

/** 演示用的种子高亮短语（保证「编辑」变换会命中它们 → 触发 fuzzy）。 */
const SEED_PHRASES = [
  "Retrieval augmented generation grounds the model in real documents",
  "Fuzzy matching survives minor edits to the source text",
];

/* -------------------------------------------------------------------------- */
/* 高亮配色                                                                     */
/* -------------------------------------------------------------------------- */

const COLORS = [
  "rgba(251, 191, 36, 0.38)", // amber
  "rgba(56, 189, 248, 0.38)", // sky
  "rgba(167, 139, 250, 0.40)", // violet
  "rgba(52, 211, 153, 0.38)", // emerald
  "rgba(251, 113, 133, 0.38)", // rose
];

interface SavedHighlight {
  id: string;
  anchor: TextAnchor;
  color: string;
}

/** 一条高亮上次恢复的结果，供状态列表展示。 */
type LocateStatus = { strategy: LocateStrategy; score: number } | "lost";

const STRATEGY_META: Record<
  LocateStrategy | "lost",
  { label: string; className: string; desc: string }
> = {
  position: {
    label: "position",
    className: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    desc: "偏移直击，页面未变",
  },
  exact: {
    label: "exact",
    className: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
    desc: "精确引用 + 上下文消歧",
  },
  fuzzy: {
    label: "fuzzy",
    className: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    desc: "近似匹配，文本被改过",
  },
  lost: {
    label: "lost",
    className: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
    desc: "相似度过低，判定丢失",
  },
};

/* -------------------------------------------------------------------------- */
/* 文档变换（模拟真实世界的文本漂移）                                            */
/* -------------------------------------------------------------------------- */

type Mutation = {
  key: string;
  label: string;
  hint: string;
  apply: (docs: Message[]) => Message[];
};

const MUTATIONS: Mutation[] = [
  {
    key: "remount",
    label: "重新渲染",
    hint: "文本不变、DOM 重建 → position 命中",
    apply: (docs) => docs.map((m) => ({ ...m })),
  },
  {
    key: "reflow",
    label: "空白重排",
    hint: "折叠/增删空白，偏移错位 → exact 命中",
    apply: (docs) =>
      docs.map((m) => ({
        ...m,
        text: m.text.replace(/\. /g, ".  ").replace(/, /g, ",\n"),
      })),
  },
  {
    key: "prepend",
    label: "顶部插段",
    hint: "前面插入新内容，全局偏移平移 → exact 命中",
    apply: (docs) => [
      {
        id: "injected",
        role: "assistant" as const,
        text: "(A brand new summary paragraph was inserted at the very top of the thread.)",
      },
      ...docs,
    ],
  },
  {
    key: "edit",
    label: "改写正文",
    hint: "在高亮内部换词/增词/改标点 → 精确搜不到 → fuzzy 命中",
    apply: (docs) =>
      docs.map((m) => ({
        ...m,
        text: m.text
          .replace(
            "grounds the model in real documents",
            "anchors the model to real, cited source documents",
          )
          .replace(
            "Fuzzy matching survives minor edits to the source text",
            "Fuzzy matching still survives small edits to the source text",
          )
          .replace("fetches relevant passages", "pulls in the relevant passages"),
      })),
  },
  {
    key: "gut",
    label: "大幅删改",
    hint: "删掉整句，超出相似度阈值 → 判定丢失",
    apply: (docs) =>
      docs.map((m) =>
        m.id === "m2"
          ? {
              ...m,
              text: "RAG basically means the model reads some documents before it answers. That's the whole idea.",
            }
          : m,
      ),
  },
];

/* -------------------------------------------------------------------------- */
/* 内联渲染：把纯文本安全转成 HTML（backtick → <code>，换行 → <br>）             */
/* textContent 与原文一致，保证偏移坐标系稳定。                                  */
/* -------------------------------------------------------------------------- */

function renderInline(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split("\n")
    .map((line) =>
      line
        .split(/(`[^`]+`)/g)
        .map((part) =>
          part.startsWith("`") && part.endsWith("`")
            ? `<code class="rounded bg-white/10 px-1 py-0.5 text-[0.85em] text-sky-200">${escape(
                part.slice(1, -1),
              )}</code>`
            : escape(part),
        )
        .join(""),
    )
    .join("<br>");
}

/**
 * 文档主体。用 React.memo + 只依赖 docs：状态/高亮/浮标变化时不重渲染，
 * 手动插入的高亮 <span> 才不会被 React 重设 innerHTML 抹掉；docs 变化时才重建，
 * 之后由 paint effect 重绘。
 */
const Transcript = React.memo(function Transcript({
  docs,
  innerRef,
}: {
  docs: Message[];
  innerRef: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={innerRef}
      className="select-text space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-[15px] leading-7"
    >
      {docs.map((m) => (
        <div key={m.id} className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-500">
            {m.role === "user" ? "You" : "Assistant"}
          </span>
          <div
            className={`rounded-lg px-3.5 py-2.5 ${
              m.role === "user" ? "bg-sky-500/[0.07] text-slate-200" : "bg-white/[0.03] text-slate-300"
            }`}
            dangerouslySetInnerHTML={{ __html: renderInline(m.text) }}
          />
        </div>
      ))}
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/* 页面                                                                        */
/* -------------------------------------------------------------------------- */

let idSeq = 0;
const nextId = () => `hl-${++idSeq}`;

export default function HighlightRecoveryPage() {
  const docRef = useRef<HTMLDivElement>(null);
  const [docs, setDocs] = useState<Message[]>(ORIGINAL);
  const [highlights, setHighlights] = useState<SavedHighlight[]>([]);
  const [statuses, setStatuses] = useState<Record<string, LocateStatus>>({});
  const [renderVersion, setRenderVersion] = useState(0);
  const [lastMutation, setLastMutation] = useState<string | null>(null);
  const [pending, setPending] = useState<{ rect: DOMRect; anchor: TextAnchor } | null>(null);

  // 用 ref 镜像最新 highlights，让重绘副作用不必把 highlights 列进依赖（否则会自触发死循环）。
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;

  // 首帧种子高亮
  useEffect(() => {
    const root = docRef.current;
    if (!root) return;
    const text = getRootText(root);
    const seeds: SavedHighlight[] = [];
    SEED_PHRASES.forEach((phrase, i) => {
      const idx = text.indexOf(phrase);
      if (idx === -1) return;
      const range = rangeFromOffsets(root, idx, idx + phrase.length);
      if (!range) return;
      const anchor = describeRange(root, range);
      if (!anchor) return;
      seeds.push({ id: nextId(), anchor, color: COLORS[i % COLORS.length] });
    });
    setHighlights(seeds);
    setRenderVersion((v) => v + 1);
  }, []);

  // 文档或高亮集合变化 → 提交后重绘（副作用放在 effect 里，不放进 setState updater）。
  useEffect(() => {
    const root = docRef.current;
    if (!root) return;
    clearHighlights(root);
    const next: Record<string, LocateStatus> = {};
    for (const hl of highlightsRef.current) {
      const located = locateAnchor(root, hl.anchor);
      if (located) {
        paintRange(located.range, hl.id, hl.color);
        next[hl.id] = { strategy: located.strategy, score: located.score };
      } else {
        next[hl.id] = "lost";
      }
    }
    setStatuses(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderVersion, docs]);

  // 选区监听：出现「＋ 高亮」浮标
  useEffect(() => {
    const onSelect = () => {
      const root = docRef.current;
      const sel = window.getSelection();
      if (!root || !sel || sel.isCollapsed || sel.rangeCount === 0) {
        setPending(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) {
        setPending(null);
        return;
      }
      const anchor = describeRange(root, range);
      if (!anchor) {
        setPending(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      setPending({ rect, anchor });
    };
    document.addEventListener("selectionchange", onSelect);
    return () => document.removeEventListener("selectionchange", onSelect);
  }, []);

  const addPending = useCallback(() => {
    if (!pending) return;
    setHighlights((prev) => [
      ...prev,
      { id: nextId(), anchor: pending.anchor, color: COLORS[prev.length % COLORS.length] },
    ]);
    setRenderVersion((v) => v + 1);
    window.getSelection()?.removeAllRanges();
    setPending(null);
  }, [pending]);

  const runMutation = useCallback((m: Mutation) => {
    setDocs((prev) => m.apply(prev));
    setLastMutation(m.key);
  }, []);

  const reset = useCallback(() => {
    setDocs(ORIGINAL.map((m) => ({ ...m })));
    setLastMutation(null);
  }, []);

  const removeHighlight = useCallback((id: string) => {
    const root = docRef.current;
    if (root) clearHighlights(root, id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    setRenderVersion((v) => v + 1);
  }, []);

  const summary = useMemo(() => {
    const counts = { position: 0, exact: 0, fuzzy: 0, lost: 0 };
    highlights.forEach((h) => {
      const st = statuses[h.id];
      if (st === "lost") counts.lost++;
      else if (st) counts[st.strategy]++;
    });
    return counts;
  }, [highlights, statuses]);

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-200">
      {/* 顶栏 */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0a0e17]/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-200"
          >
            <ArrowLeft size={16} /> 返回
          </Link>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Highlighter size={16} className="text-amber-300" /> Highlight Recovery
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {/* 说明 */}
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-semibold text-slate-100">网页高亮的模糊恢复</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
            存的是<strong className="text-slate-200">文本锚点</strong>（引用文本 + 前后上下文 +
            字符偏移），而不是 DOM 路径。恢复时三层降级：
            <Badge s="position" /> 偏移直击 → <Badge s="exact" /> 精确引用 + 上下文消歧 →{" "}
            <Badge s="fuzzy" /> 近似子串匹配。在下方划词存高亮，再点各种「页面漂移」，看它怎么被找回来。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          {/* 文档 */}
          <section>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {MUTATIONS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => runMutation(m)}
                  title={m.hint}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                    lastMutation === m.key
                      ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
              <button
                onClick={reset}
                className="ml-auto flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <RotateCcw size={13} /> 重置
              </button>
            </div>

            {lastMutation && (
              <p className="mb-3 flex items-center gap-1.5 text-xs text-amber-300/80">
                <Sparkles size={12} />
                {MUTATIONS.find((m) => m.key === lastMutation)?.hint}
                <span className="text-slate-500">— 点右侧「恢复高亮」重新定位</span>
              </p>
            )}

            <Transcript docs={docs} innerRef={docRef} />
          </section>

          {/* 侧栏：恢复 + 状态 */}
          <aside className="space-y-4">
            <button
              onClick={() => setRenderVersion((v) => v + 1)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-amber-950 transition hover:bg-amber-300"
            >
              <Highlighter size={16} /> 恢复高亮
            </button>

            <div className="grid grid-cols-4 gap-1.5 text-center">
              {(["position", "exact", "fuzzy", "lost"] as const).map((s) => (
                <div key={s} className="rounded-md border border-white/5 bg-white/[0.02] py-1.5">
                  <div className="text-base font-semibold text-slate-100">{summary[s]}</div>
                  <div className="text-[10px] text-slate-500">{STRATEGY_META[s].label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {highlights.length === 0 && (
                <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-slate-500">
                  在左侧文档里划词以创建高亮
                </p>
              )}
              {highlights.map((hl) => {
                const st = statuses[hl.id];
                const meta =
                  st === "lost" ? STRATEGY_META.lost : st ? STRATEGY_META[st.strategy] : null;
                return (
                  <div
                    key={hl.id}
                    className="group rounded-lg border border-white/10 bg-white/[0.02] p-2.5"
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm"
                        style={{ background: hl.color }}
                      />
                      {meta ? (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${meta.className}`}
                        >
                          {meta.label}
                          {st && st !== "lost" ? ` · ${(st.score * 100).toFixed(0)}%` : ""}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">未恢复</span>
                      )}
                      <button
                        onClick={() => removeHighlight(hl.id)}
                        className="ml-auto text-[10px] text-slate-600 opacity-0 transition hover:text-rose-300 group-hover:opacity-100"
                      >
                        删除
                      </button>
                    </div>
                    <p className="line-clamp-2 text-xs leading-snug text-slate-400">
                      “{hl.anchor.quote.exact}”
                    </p>
                    {meta && <p className="mt-1 text-[10px] text-slate-600">{meta.desc}</p>}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </main>

      {/* 选区浮标 */}
      {pending && (
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            addPending();
          }}
          className="fixed z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-amber-950 shadow-lg shadow-amber-500/30 transition hover:bg-amber-300"
          style={{
            left: pending.rect.left + pending.rect.width / 2,
            top: pending.rect.top - 40,
          }}
        >
          <Highlighter size={13} /> 存为高亮
        </button>
      )}
    </div>
  );
}

function Badge({ s }: { s: LocateStrategy }) {
  const meta = STRATEGY_META[s];
  return (
    <span
      className={`mx-0.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
