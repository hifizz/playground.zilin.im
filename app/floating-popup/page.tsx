"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  computePopupPosition,
  explainPopupPosition,
  type Rect,
  type Side,
  type Size,
} from "./position";

/**
 * ============================================================================
 * Floating Popup 定位模型 · 研究页
 * ============================================================================
 * 模型见 ./position.ts：popup 围绕 anchor（选区）在 container 内定位，
 * 右 → 下 → 左 → 上 择位；全放不下时取遮挡选区最小的兜底位。
 *
 * 本页两个案例：
 *   1. 指定 ContainerRect 的沙箱 —— 拖选区、调 popup 尺寸，实时看择位过程；
 *   2. container = 浏览器 viewport —— 真实文本选择，气泡跟随选区。
 * ============================================================================
 */

const SIDE_LABEL: Record<Side, string> = { right: "右", bottom: "下", left: "左", top: "上" };

function clampNum(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/* -------------------------------------------------------------------------- */
/* 通用小组件                                                                  */
/* -------------------------------------------------------------------------- */

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-3 py-1 text-xs">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 accent-indigo-500"
      />
      <span className="w-10 shrink-0 text-right tabular-nums">{value}</span>
    </label>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 text-sm font-medium">{title}</h2>
      <div className="rounded-xl bg-muted/40 p-4">{children}</div>
    </div>
  );
}

function Step({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="w-24 shrink-0 whitespace-nowrap font-medium text-foreground">{k}</span>
      <span className="flex-1">{children}</span>
    </li>
  );
}

const btnClass =
  "inline-flex items-center rounded-lg border bg-muted/40 px-3 py-1.5 text-xs transition-colors hover:bg-muted";

/* -------------------------------------------------------------------------- */
/* 案例 1：指定 ContainerRect 的交互沙箱                                       */
/* -------------------------------------------------------------------------- */

const POPUP_PRESETS = [
  { name: "小工具条", w: 200, h: 40 },
  { name: "中卡片", w: 320, h: 180 },
  { name: "大卡片", w: 420, h: 300 },
  { name: "巨大卡片", w: 640, h: 480 },
  { name: "宽大高小", w: 800, h: 200 },
  { name: "宽小高大", w: 200, h: 800 },
];

function Sandbox() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const [containerH, setContainerH] = useState(520);

  const [anchor, setAnchor] = useState<Rect>({ left: 250, top: 170, width: 170, height: 26 });
  const [popupW, setPopupW] = useState(240);
  const [popupH, setPopupH] = useState(140);
  const [gap, setGap] = useState(4);
  const [safePadding, setSafePadding] = useState(12);
  const [showCandidates, setShowCandidates] = useState(true);

  // container 宽度跟随页面布局（拖浏览器窗口也是在改 ContainerRect）
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setContainerW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const beginDrag = (
    e: React.PointerEvent,
    mode: "move" | "resize",
    grabDX: number,
    grabDY: number,
  ) => {
    e.preventDefault();
    const move = (ev: PointerEvent) => {
      const r = containerRef.current?.getBoundingClientRect();
      if (!r) return;
      const x = ev.clientX - r.left;
      const y = ev.clientY - r.top;
      setAnchor((a) => {
        if (mode === "move") {
          return {
            ...a,
            left: clampNum(x - grabDX, 0, Math.max(0, r.width - a.width)),
            top: clampNum(y - grabDY, 0, Math.max(0, r.height - a.height)),
          };
        }
        return {
          ...a,
          width: clampNum(x - a.left, 24, r.width - a.left),
          height: clampNum(y - a.top, 14, r.height - a.top),
        };
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // 点空白处：选区中心跳到指针位置，随后可继续拖
  const onContainerPointerDown = (e: React.PointerEvent) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    setAnchor((a) => ({
      ...a,
      left: clampNum(x - a.width / 2, 0, Math.max(0, r.width - a.width)),
      top: clampNum(y - a.height / 2, 0, Math.max(0, r.height - a.height)),
    }));
    beginDrag(e, "move", anchor.width / 2, anchor.height / 2);
  };

  const onAnchorPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    beginDrag(e, "move", e.clientX - r.left - anchor.left, e.clientY - r.top - anchor.top);
  };

  const onResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    beginDrag(e, "resize", 0, 0);
  };

  // 容器缩小时把 anchor 收回界内再计算
  const a: Rect = {
    left: clampNum(anchor.left, 0, Math.max(0, containerW - anchor.width)),
    top: clampNum(anchor.top, 0, Math.max(0, containerH - anchor.height)),
    width: Math.min(anchor.width, Math.max(24, containerW)),
    height: Math.min(anchor.height, containerH),
  };
  const container: Rect = { left: 0, top: 0, width: containerW, height: containerH };
  const { result, candidates } = explainPopupPosition(
    a,
    { width: popupW, height: popupH },
    container,
    { gap, safePadding },
  );
  const anchorArea = a.width * a.height;
  const coveredPct = anchorArea > 0 ? Math.round((result.overlapArea / anchorArea) * 100) : 0;

  return (
    <>
      {/* ContainerRect */}
      <div
        ref={containerRef}
        onPointerDown={onContainerPointerDown}
        className="relative w-full cursor-crosshair overflow-hidden rounded-2xl border bg-muted/30"
        style={{ height: containerH, touchAction: "none" }}
      >
        <span className="pointer-events-none absolute left-2.5 top-1.5 text-[10px] tracking-wide text-muted-foreground/70">
          ContainerRect {Math.round(containerW)} × {containerH}
        </span>

        {/* 安全区（container 内缩 safePadding） */}
        <div
          className="pointer-events-none absolute rounded-lg border border-dashed border-muted-foreground/25"
          style={{ inset: safePadding }}
        />

        {/* 四向候选（虚线幽灵） */}
        {containerW > 0 &&
          showCandidates &&
          candidates
            .filter((c) => c.side !== result.side)
            .map((c) => (
              <div
                key={c.side}
                className="pointer-events-none absolute rounded-lg border border-dashed"
                style={{
                  left: c.left,
                  top: c.top,
                  width: popupW,
                  height: popupH,
                  borderColor: c.fits ? "rgba(52,211,153,0.5)" : "rgba(248,113,113,0.4)",
                }}
              >
                <span
                  className="absolute left-1.5 top-0.5 text-[10px]"
                  style={{ color: c.fits ? "rgba(52,211,153,0.8)" : "rgba(248,113,113,0.7)" }}
                >
                  {SIDE_LABEL[c.side]}
                  {c.fits ? "" : " ✕"}
                </span>
              </div>
            ))}

        {/* FloatingPopup */}
        {containerW > 0 && (
          <div
            className="pointer-events-none absolute overflow-hidden rounded-xl text-white shadow-lg shadow-indigo-900/40"
            style={{
              left: result.left,
              top: result.top,
              width: popupW,
              height: popupH,
              background: "linear-gradient(155deg, #6366f1, #4f46e5 70%)",
              transition: "left 120ms ease-out, top 120ms ease-out",
            }}
          >
            <div className="flex flex-wrap items-center gap-1.5 p-2.5">
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium">
                {SIDE_LABEL[result.side]}侧
              </span>
              {result.fallback && (
                <span className="rounded-full bg-amber-300/90 px-2 py-0.5 text-[11px] font-medium text-amber-950">
                  fallback · 遮挡 {coveredPct}%
                </span>
              )}
            </div>
            <div className="px-2.5 text-[11px] leading-relaxed text-white/70">
              FloatingPopup {popupW} × {popupH}
            </div>
          </div>
        )}

        {/* SelectedRect（可拖动 / 右下角可改尺寸） */}
        <div
          onPointerDown={onAnchorPointerDown}
          className="absolute cursor-move rounded border border-amber-400 bg-amber-400/25"
          style={{ left: a.left, top: a.top, width: a.width, height: a.height, touchAction: "none" }}
        >
          <span className="pointer-events-none absolute -top-4.5 left-0 whitespace-nowrap text-[10px] text-amber-500">
            SelectedRect
          </span>
          <div
            onPointerDown={onResizePointerDown}
            className="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize rounded-sm border border-amber-400 bg-background"
          />
        </div>
      </div>

      {/* 实时读数 */}
      <p className="mt-2 text-xs text-muted-foreground">
        放置方向：<span className="font-medium text-foreground">{SIDE_LABEL[result.side]}</span>
        {" · "}
        {result.fallback ? (
          <span className="text-amber-500">四边都放不下 → 取遮挡选区最小的兜底位（遮挡 {coveredPct}%）</span>
        ) : (
          "干净放下，未遮挡选区"
        )}
      </p>

      {/* 调参 */}
      <div className="mt-3 grid grid-cols-1 gap-x-7 rounded-2xl bg-muted/40 px-5 py-3.5 sm:grid-cols-2">
        <Slider label="popup 宽" value={popupW} min={60} max={880} onChange={setPopupW} />
        <Slider label="popup 高" value={popupH} min={36} max={880} onChange={setPopupH} />
        <Slider label="呼吸空间 gap" value={gap} min={0} max={24} onChange={setGap} />
        <Slider label="安全边距 padding" value={safePadding} min={0} max={48} onChange={setSafePadding} />
        <Slider label="容器高" value={containerH} min={220} max={800} onChange={setContainerH} />
        <label className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={showCandidates}
            onChange={(e) => setShowCandidates(e.target.checked)}
            className="accent-indigo-500"
          />
          显示四向候选（绿 = 放得下 / 红 = 放不下）
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">popup 预设：</span>
        {POPUP_PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            className={btnClass}
            onClick={() => {
              setPopupW(p.w);
              setPopupH(p.h);
            }}
          >
            {p.name} {p.w}×{p.h}
          </button>
        ))}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* 案例 2：container = 浏览器 viewport，真实文本选择                            */
/* -------------------------------------------------------------------------- */

const PASSAGE = [
  "选中这段文字试试。松开鼠标后，气泡会围绕选区的包围盒出现：优先放在右侧，右侧放不下换下方，然后是左侧、上方。这里的 ContainerRect 就是浏览器 viewport —— 无论怎么选，气泡都不会被窗口边缘裁掉，且与边缘保持 12px 的安全边距。",
  "跨段落拖一个多行选区也可以：多行选区的若干矩形会被合并成一个 bounding rect 参与计算，气泡围绕这个整体定位。选中之后不要取消，滚动页面 —— 选区在 viewport 里的位置变了，气泡会实时重新择位，靠近窗口底部时你能看到它从下方翻到上方。",
  "把上面的开关切到「大卡片」，再选中一小段文字并把窗口调矮：当四个方向都塞不下时，模型进入 fallback，在四个 clamp 进安全区的候选里挑遮挡选区面积最小的那个 —— 宁可盖住别处，尽量露出你选中的内容。",
];

/** 案例 2 的气泡预设：w/h 为 null 表示内容自适应的工具条 */
const BUBBLE_PRESETS: { name: string; w: number | null; h: number | null }[] = [
  { name: "小工具条", w: null, h: null },
  { name: "中卡片", w: 320, h: 180 },
  { name: "大卡片", w: 420, h: 300 },
  { name: "巨大卡片", w: 640, h: 480 },
  { name: "宽大高小 800×200", w: 800, h: 200 },
  { name: "宽小高大 200×800", w: 200, h: 800 },
];

function ViewportSelectionDemo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const [bubbleSize, setBubbleSize] = useState<Size | null>(null);
  const [presetIdx, setPresetIdx] = useState(0);
  const preset = BUBBLE_PRESETS[presetIdx];

  const refresh = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setAnchorRect(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    if (!el || !sectionRef.current?.contains(el)) {
      setAnchorRect(null);
      return;
    }
    const r = range.getBoundingClientRect();
    if (r.width < 1 && r.height < 1) {
      setAnchorRect(null);
      return;
    }
    setAnchorRect({ left: r.left, top: r.top, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refresh);
    window.addEventListener("scroll", refresh, true);
    window.addEventListener("resize", refresh);
    return () => {
      document.removeEventListener("selectionchange", refresh);
      window.removeEventListener("scroll", refresh, true);
      window.removeEventListener("resize", refresh);
    };
  }, [refresh]);

  // 测量气泡真实尺寸（内容驱动，不写死）
  const mounted = anchorRect !== null;
  useLayoutEffect(() => {
    const el = bubbleRef.current;
    if (!el) return;
    const measure = () => setBubbleSize({ width: el.offsetWidth, height: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted, presetIdx]);

  const pos =
    anchorRect && bubbleSize
      ? computePopupPosition(
          anchorRect,
          bubbleSize,
          { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight },
          { safePadding: 12, gap: 6 },
        )
      : null;

  // 气泡上按下鼠标不清空选区
  const keepSelection = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div ref={sectionRef}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>气泡尺寸：</span>
        {BUBBLE_PRESETS.map((p, i) => (
          <button
            key={p.name}
            type="button"
            className={`${btnClass} ${i === presetIdx ? "border-indigo-500/60 text-foreground" : ""}`}
            onClick={() => setPresetIdx(i)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border bg-muted/30 p-5 text-sm leading-7 text-foreground/90 selection:bg-amber-400/40">
        {PASSAGE.map((t, i) => (
          <p key={i}>{t}</p>
        ))}
      </div>

      {anchorRect && (
        <div
          ref={bubbleRef}
          onMouseDown={keepSelection}
          className="fixed z-50"
          style={{
            left: pos ? pos.left : -9999,
            top: pos ? pos.top : -9999,
            visibility: pos ? "visible" : "hidden",
          }}
        >
          {preset.w !== null && preset.h !== null ? (
            <div
              className="flex flex-col overflow-hidden rounded-2xl border border-indigo-400/30 bg-background p-4 shadow-2xl shadow-indigo-950/30"
              style={{ width: preset.w, height: preset.h }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">AI 解释 · {preset.name}</span>
                {pos && (
                  <span className="shrink-0 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] text-indigo-400">
                    {SIDE_LABEL[pos.side]}侧{pos.fallback ? " · fallback" : ""}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="h-2.5 w-11/12 rounded bg-muted" />
                <div className="h-2.5 w-full rounded bg-muted" />
                <div className="h-2.5 w-4/5 rounded bg-muted" />
                <div className="h-2.5 w-2/3 rounded bg-muted" />
              </div>
              <div className="mt-3 flex-1 rounded-lg bg-muted/60" />
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-900/95 px-1.5 py-1 text-xs text-zinc-100 shadow-xl backdrop-blur">
              {["标记", "复制", "提问"].map((t) => (
                <button
                  key={t}
                  type="button"
                  className="rounded-lg px-2.5 py-1.5 transition-colors hover:bg-white/10"
                >
                  {t}
                </button>
              ))}
              {pos && (
                <span className="ml-1 rounded-md bg-indigo-500/25 px-1.5 py-0.5 text-[10px] text-indigo-300">
                  {SIDE_LABEL[pos.side]}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 页面                                                                        */
/* -------------------------------------------------------------------------- */

export default function FloatingPopupPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} />
          playground
        </Link>

        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Floating Popup 定位模型</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            抽象自「选区气泡」：popup 围绕 SelectedRect 在 ContainerRect 内定位，右 → 下 → 左 → 上
            择位，永不越出安全区；四边都放不下时取遮挡选区最小的兜底位。纯函数模型见{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">position.ts</code>。
          </p>
        </header>

        <section className="mb-8">
          <h2 className="mb-2 text-sm font-medium">
            案例 1 · 指定 ContainerRect 的沙箱
            <span className="ml-2 font-normal text-muted-foreground">
              点击 / 拖动移动选区，右下角手柄改选区大小
            </span>
          </h2>
          {/* 沙箱突破正文栏宽，尽量占满视口（最宽 1100px 居中） */}
          <div className="relative left-1/2 w-[min(100vw-3rem,1100px)] -translate-x-1/2">
            <Sandbox />
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-sm font-medium">
            案例 2 · container = 浏览器 viewport
            <span className="ml-2 font-normal text-muted-foreground">真实文本选择</span>
          </h2>
          <ViewportSelectionDemo />
        </section>

        <Block title="定位规则">
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <Step k="输入">
              anchor（SelectedRect，多行选区取 bounding rect）、popup 尺寸、container（ContainerRect）、
              gap（默认 4）、safePadding（默认 12）。
            </Step>
            <Step k="择位">
              按 右 → 下 → 左 → 上 逐个尝试，第一个能干净放下的方向即采用；交叉轴对选区居中，
              越界时沿交叉轴滑动，不算失败。
            </Step>
            <Step k="硬约束">
              popup 永不越出 container 内缩 safePadding 的安全区，不会被裁切
              （popup 比安全区还大时贴左上角，属于无解情形）。
            </Step>
            <Step k="兜底">
              四边都放不下时，把各方向候选 clamp 进安全区，选遮挡选区面积最小的一个 ——
              宁可盖住别处，尽量不遮住用户可见选区。
            </Step>
          </ul>
        </Block>

        <Block title="Usage">
          <pre className="overflow-x-auto text-xs leading-relaxed text-muted-foreground">
            {`import { computePopupPosition } from "./position";

const { left, top, side, fallback } = computePopupPosition(
  selectionRect,                     // anchor：选区包围盒（DOMRect 即可）
  { width: 240, height: 44 },        // popup 尺寸
  { left: 0, top: 0,                 // container：这里用 viewport
    width: innerWidth, height: innerHeight },
  { safePadding: 12, gap: 4 },       // 可选，默认即这两个值
);
// => position: fixed; left/top 直接可用；side/fallback 供动画与调试`}
          </pre>
        </Block>
      </div>
    </div>
  );
}
