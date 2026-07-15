"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Pencil, RotateCw, Sparkles, Trash2, X } from "lucide-react";
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
 * Highlight Recovery · 研究页（浅色 · 阅读高亮）
 * ============================================================================
 * 讲一个日常故事：你在读一篇笔记，把重要的句子划出来。之后这篇笔记被编辑、
 * 被重新排版、你刷新了页面——你的高亮还在，而且贴在正确的文字上。
 *
 * 秘诀：高亮存的是「你划了哪句话」（引用文本 + 前后上下文 + 字符偏移），
 * 不是「它在 DOM 的第几个节点」。恢复时三层降级 position → exact → fuzzy。
 * 算法见 ./anchor-core.ts 与 ./anchor.ts，抽象自 chat-aside 插件。
 * ============================================================================
 */

/* -------------------------------------------------------------------------- */
/* 文档                                                                        */
/* -------------------------------------------------------------------------- */

const ORIGINAL_NOTE = [
  "我们读得越来越多，却记得越来越少。信息像水一样流过，留下的痕迹很浅。",
  "一个朴素但有效的办法是主动标记：读到打动你的句子，就把它划出来。划线这个动作本身，就是在告诉大脑「这里重要」。",
  "但光划线不够。真正让记忆变牢的，是隔一段时间再回来看一眼。所以你需要一个能把这些高亮长期存下来、随时找回来的地方。",
  "难点在于网页会变：文章可能被编辑、被重新排版，甚至整段重写。如果高亮记的是「第几个标签第几个字」，页面一变就全乱了。更稳的做法，是记住你划了哪句话，而不是它在页面里的位置。",
];

/** 一进页面就带的两条示例高亮，让「编辑后跟随」立刻可玩。 */
const SEED_PHRASES = ["读到打动你的句子，就把它划出来", "隔一段时间再回来看一眼"];

/** 一键「换种说法」——模拟文章被编辑/重写，让高亮走 fuzzy 恢复。 */
const REWRITTEN_NOTE = [
  "现代人读得越来越多，可真正记住的越来越少。信息像流水一样淌过，留下的痕迹其实很浅。",
  "一个简单却管用的习惯是主动做标记：读到打动你的句子，就顺手把它划出来。划线这个动作本身，就是在提醒大脑「注意，这里很重要」。",
  "不过只靠划线还不够。真正让记忆扎根的，是隔一段时间再回来看一眼。因此你需要一个地方，能把这些高亮长期保存、随时找回来。",
  "麻烦的是网页总在变：文章会被编辑、会重新排版，有时甚至整段推倒重写。要是高亮记的是「第几个标签第几个字」，页面一变就全错位了。更稳妥的办法，是记住你到底划了哪句话，而不是它当时待在页面的哪个位置。",
];

/* -------------------------------------------------------------------------- */
/* 荧光笔配色（浅色底，像真的马克笔）                                            */
/* -------------------------------------------------------------------------- */

const MARKERS = [
  { key: "yellow", label: "黄", paint: "rgba(253, 224, 71, 0.55)", dot: "#facc15" },
  { key: "green", label: "绿", paint: "rgba(134, 239, 172, 0.6)", dot: "#4ade80" },
  { key: "pink", label: "粉", paint: "rgba(249, 168, 212, 0.55)", dot: "#f472b6" },
  { key: "blue", label: "蓝", paint: "rgba(147, 197, 253, 0.6)", dot: "#60a5fa" },
];

interface Highlight {
  id: string;
  anchor: TextAnchor;
  color: string;
}

type Status = { strategy: LocateStrategy; score: number } | "lost";

/* -------------------------------------------------------------------------- */
/* 文本 → 安全 HTML（换行 → <br>，textContent 与原文一致以保证偏移坐标稳定）      */
/* -------------------------------------------------------------------------- */

function toHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

/** 笔记正文。React.memo + 只依赖 note/mountKey：其它状态变化不重渲染，手绘高亮 span 不被抹掉。 */
const NoteBody = React.memo(function NoteBody({
  paragraphs,
  innerRef,
}: {
  paragraphs: string[];
  innerRef: React.Ref<HTMLDivElement>;
}) {
  return (
    <div ref={innerRef} className="hlr-note space-y-4">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className="text-[15px] leading-[1.9] text-neutral-700 dark:text-neutral-300"
          dangerouslySetInnerHTML={{ __html: toHtml(p) }}
        />
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
  const noteRef = useRef<HTMLDivElement>(null);
  const [paragraphs, setParagraphs] = useState<string[]>(ORIGINAL_NOTE);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [renderVersion, setRenderVersion] = useState(0);
  const [mountKey, setMountKey] = useState(0);
  const [pending, setPending] = useState<{ rect: DOMRect; anchor: TextAnchor } | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [reloading, setReloading] = useState(false);
  const [flash, setFlash] = useState<string | null>(null); // 描述本轮变化，触发提示条

  const flashSpansRef = useRef(false); // 本次重绘后是否给高亮做一次「亮一下」动画

  /* -- 提交后重绘：清掉旧高亮，按锚点重新定位并绘制 ------------------------- */
  useEffect(() => {
    if (editing) return; // 编辑态下正文是 textarea，不绘制
    const root = noteRef.current;
    if (!root) return;
    clearHighlights(root);
    const next: Record<string, Status> = {};
    const paintedIds: string[] = [];
    for (const hl of highlights) {
      // 阈值放宽到 0.55：中文单字信息密度高，几个字的改动就压掉不少相似度，
      // 对「阅读高亮」这种容忍编辑的场景，宁可近似恢复也别轻易判丢。
      const located = locateAnchor(root, hl.anchor, { fuzzyThreshold: 0.55 });
      if (located) {
        paintRange(located.range, hl.id, hl.color);
        next[hl.id] = { strategy: located.strategy, score: located.score };
        paintedIds.push(hl.id);
      } else {
        next[hl.id] = "lost";
      }
    }
    // 状态由「提交后读 DOM 重新定位」派生，只能在 effect 里回写；不构成级联循环
    // （setStatuses 不改 highlights/paragraphs 等依赖）。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatuses(next);

    if (flashSpansRef.current) {
      flashSpansRef.current = false;
      pulse(root, paintedIds);
    }
  }, [renderVersion, paragraphs, mountKey, editing, highlights]);

  /* -- 首帧种子高亮 ------------------------------------------------------- */
  useEffect(() => {
    const root = noteRef.current;
    if (!root) return;
    const text = getRootText(root);
    const seeds: Highlight[] = [];
    SEED_PHRASES.forEach((phrase, i) => {
      const idx = text.indexOf(phrase);
      if (idx === -1) return;
      const range = rangeFromOffsets(root, idx, idx + phrase.length);
      if (!range) return;
      const anchor = describeRange(root, range);
      if (anchor) seeds.push({ id: nextId(), anchor, color: MARKERS[i % MARKERS.length].paint });
    });
    // 种子高亮需先挂载测量 DOM 再回写，属于合理的提交后初始化。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlights(seeds);
    setRenderVersion((v) => v + 1);
  }, []);

  /* -- 选区 → 荧光笔浮标 -------------------------------------------------- */
  useEffect(() => {
    const onSelect = () => {
      if (editing) return;
      const root = noteRef.current;
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
      setPending({ rect: range.getBoundingClientRect(), anchor });
    };
    document.addEventListener("selectionchange", onSelect);
    return () => document.removeEventListener("selectionchange", onSelect);
  }, [editing]);

  const addHighlight = useCallback(
    (color: string) => {
      if (!pending) return;
      setHighlights((prev) => [...prev, { id: nextId(), anchor: pending.anchor, color }]);
      setRenderVersion((v) => v + 1);
      window.getSelection()?.removeAllRanges();
      setPending(null);
    },
    [pending],
  );

  const removeHighlight = useCallback((id: string) => {
    const root = noteRef.current;
    if (root) clearHighlights(root, id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    setStatuses((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setRenderVersion((v) => v + 1);
  }, []);

  const focusHighlight = useCallback((id: string) => {
    const root = noteRef.current;
    if (!root) return;
    const span = root.querySelector(`span[data-hlr-mark="${cssEscape(id)}"]`) as HTMLElement | null;
    if (!span) return;
    span.scrollIntoView({ behavior: "smooth", block: "center" });
    pulse(root, [id]);
  }, []);

  /* -- 三个核心动作 ------------------------------------------------------ */

  // 1) 刷新页面：清空高亮 + 重挂正文（模拟真实 reload），随后自动恢复并亮一下。
  const reloadPage = useCallback(() => {
    const root = noteRef.current;
    if (root) clearHighlights(root);
    setReloading(true);
    flashSpansRef.current = true;
    setMountKey((k) => k + 1);
    setFlash("刷新后，高亮自动回到了原来的句子上。");
    window.setTimeout(() => setReloading(false), 420);
  }, []);

  // 2) 编辑：进入 textarea 编辑态。
  const startEdit = useCallback(() => {
    setDraft(paragraphs.join("\n\n"));
    setPending(null);
    setEditing(true);
  }, [paragraphs]);

  const saveEdit = useCallback(() => {
    const next = draft
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
    setParagraphs(next.length ? next : [""]);
    setEditing(false);
    flashSpansRef.current = true;
    setRenderVersion((v) => v + 1);
    setFlash("内容改了，高亮跟着走——精确对不上的用近似匹配找回。");
  }, [draft]);

  // 一键「换种说法」：把整篇替换成同义改写版，演示大范围编辑后的 fuzzy 恢复。
  const rewriteNote = useCallback(() => {
    setParagraphs(REWRITTEN_NOTE);
    flashSpansRef.current = true;
    setRenderVersion((v) => v + 1);
    setFlash("整篇被改写成另一种说法，高亮靠近似匹配贴了回去。");
  }, []);

  const reset = useCallback(() => {
    setParagraphs(ORIGINAL_NOTE);
    setEditing(false);
    setRenderVersion((v) => v + 1);
    setFlash(null);
  }, []);

  const recovered = useMemo(
    () => highlights.filter((h) => statuses[h.id] && statuses[h.id] !== "lost").length,
    [highlights, statuses],
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <style>{FLASH_CSS}</style>

      {/* 顶栏 */}
      <header className="border-b border-neutral-200 bg-white/70 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-neutral-500 transition hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            <ArrowLeft size={16} /> 返回
          </Link>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            高亮的模糊恢复
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            划出来的重点，怎么在页面变了之后还找得回？
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            选中下面的句子把它划成高亮。然后<span className="font-medium text-neutral-700 dark:text-neutral-300">编辑这篇笔记</span>、或
            <span className="font-medium text-neutral-700 dark:text-neutral-300">刷新页面</span>——你会看到高亮依然贴在正确的文字上。
            因为它存的是「你划了哪句话」，不是它在 DOM 里的位置。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
          {/* 笔记卡片 */}
          <section>
            {/* 工具条 */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {!editing ? (
                <>
                  <ToolbarButton onClick={startEdit} icon={<Pencil size={14} />}>
                    编辑这篇笔记
                  </ToolbarButton>
                  <ToolbarButton onClick={reloadPage} icon={<RotateCw size={14} />}>
                    刷新页面
                  </ToolbarButton>
                  <ToolbarButton onClick={rewriteNote} icon={<Sparkles size={14} />}>
                    换种说法
                  </ToolbarButton>
                  <button
                    onClick={reset}
                    className="ml-auto text-xs text-neutral-400 transition hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    重置
                  </button>
                </>
              ) : (
                <>
                  <ToolbarButton onClick={saveEdit} icon={<Check size={14} />} primary>
                    完成编辑
                  </ToolbarButton>
                  <ToolbarButton onClick={() => setEditing(false)} icon={<X size={14} />}>
                    取消
                  </ToolbarButton>
                  <span className="text-xs text-neutral-400">改几个字试试，高亮会自己跟过去</span>
                </>
              )}
            </div>

            <div
              className={`rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-opacity duration-200 dark:border-neutral-800 dark:bg-neutral-900 ${
                reloading ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="mb-4 flex items-center gap-2 border-b border-neutral-100 pb-3 dark:border-neutral-800">
                <span className="text-[13px] font-medium text-neutral-400">笔记</span>
                <span className="text-[15px] font-semibold text-neutral-800 dark:text-neutral-100">
                  如何记住你读过的东西
                </span>
              </div>

              {editing ? (
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="h-72 w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[15px] leading-[1.9] text-neutral-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
                />
              ) : (
                <NoteBody key={mountKey} paragraphs={paragraphs} innerRef={noteRef} />
              )}
            </div>

            {flash && !editing && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-blue-500 dark:text-blue-400">
                <Sparkles size={12} /> {flash}
              </p>
            )}
          </section>

          {/* 右栏：你的标记 */}
          <aside>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                你的标记
              </span>
              {highlights.length > 0 && (
                <span className="text-xs text-neutral-400">
                  {recovered}/{highlights.length} 已恢复
                </span>
              )}
            </div>

            <div className="space-y-2">
              {highlights.length === 0 && (
                <p className="rounded-xl border border-dashed border-neutral-200 px-3 py-8 text-center text-xs leading-relaxed text-neutral-400 dark:border-neutral-800">
                  选中左边的句子
                  <br />
                  用荧光笔把它划出来
                </p>
              )}
              {highlights.map((hl) => (
                <MarkRow
                  key={hl.id}
                  hl={hl}
                  status={statuses[hl.id]}
                  onFocus={() => focusHighlight(hl.id)}
                  onRemove={() => removeHighlight(hl.id)}
                />
              ))}
            </div>
          </aside>
        </div>
      </main>

      {/* 荧光笔浮标 */}
      {pending && !editing && (
        <div
          className="fixed z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-neutral-200 bg-white px-2 py-1.5 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
          style={{ left: pending.rect.left + pending.rect.width / 2, top: pending.rect.top - 46 }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {MARKERS.map((m) => (
            <button
              key={m.key}
              title={`${m.label}色高亮`}
              onClick={() => addHighlight(m.paint)}
              className="h-6 w-6 rounded-full border border-black/5 transition hover:scale-110"
              style={{ background: m.dot }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 子组件与工具                                                                */
/* -------------------------------------------------------------------------- */

function ToolbarButton({
  onClick,
  icon,
  children,
  primary,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        primary
          ? "bg-blue-600 text-white hover:bg-blue-500"
          : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function MarkRow({
  hl,
  status,
  onFocus,
  onRemove,
}: {
  hl: Highlight;
  status?: Status;
  onFocus: () => void;
  onRemove: () => void;
}) {
  const info = describeStatus(status);
  return (
    <div className="group rounded-xl border border-neutral-200 bg-white p-2.5 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900">
      <button onClick={onFocus} className="block w-full text-left">
        <span
          className="mr-1.5 inline-block align-middle"
          style={{
            background: hl.color,
            padding: "1px 4px",
            borderRadius: 3,
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.03)",
          }}
        >
          <span className="line-clamp-2 align-middle text-xs leading-snug text-neutral-700 dark:text-neutral-200">
            {hl.anchor.quote.exact}
          </span>
        </span>
      </button>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />
        <span className={`text-[11px] ${info.text}`}>{info.label}</span>
        <button
          onClick={onRemove}
          title="删除"
          className="ml-auto text-neutral-300 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function describeStatus(status?: Status): { label: string; dot: string; text: string } {
  if (!status) return { label: "待恢复", dot: "bg-neutral-300", text: "text-neutral-400" };
  if (status === "lost")
    return { label: "内容改动过大，未找回", dot: "bg-red-400", text: "text-red-500" };
  if (status.strategy === "fuzzy")
    return {
      label: `内容有改动，近似恢复 · ${Math.round(status.score * 100)}%`,
      dot: "bg-amber-400",
      text: "text-amber-600 dark:text-amber-500",
    };
  return { label: "已恢复", dot: "bg-emerald-400", text: "text-emerald-600 dark:text-emerald-500" };
}

function pulse(root: Element, ids: string[]) {
  ids.forEach((id) => {
    root.querySelectorAll(`span[data-hlr-mark="${cssEscape(id)}"]`).forEach((el) => {
      const span = el as HTMLElement;
      span.classList.remove("hlr-flash");
      void span.offsetWidth; // 重启动画
      span.classList.add("hlr-flash");
      span.addEventListener("animationend", () => span.classList.remove("hlr-flash"), {
        once: true,
      });
    });
  });
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
  return value.replace(/"/g, '\\"');
}

const FLASH_CSS = `
.hlr-note ::selection { background: rgba(253, 224, 71, 0.4); }
@keyframes hlrPulse {
  0% { filter: none; }
  25% { filter: brightness(1.15) saturate(1.5); }
  100% { filter: none; }
}
.hlr-flash { animation: hlrPulse 900ms ease-out; border-radius: 3px; }
`;
