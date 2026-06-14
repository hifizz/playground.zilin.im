"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * ============================================================================
 * Glyph · 流体文本动画库（高性能版 · 零依赖）
 * ============================================================================
 *
 * 灵感来自 calligraph.raphaelsalaja.com（"Fluid text transitions powered by Motion"）。
 * 本版本**不依赖 framer-motion**，完全用浏览器原生 Web Animations API（WAAPI）实现，
 * 目标是把帧率拉满。
 *
 * 为什么这样最快（三条铁律）：
 *
 *   1. 只动 transform / opacity。
 *      这两个属性的 WAAPI 动画跑在**合成线程（compositor）**，不经过主线程的
 *      样式/布局/绘制，主线程再忙也不掉帧。绝不每帧动 filter:blur()（要重栅格化）、
 *      width / left（要重排）。
 *
 *   2. 不每帧碰 React / DOM 测量。
 *      位移用 FLIP：变化时只测量一次旧/新位置，剩下交给合成层 transform。
 *      数字用单条 requestAnimationFrame + 直接写 textContent，不每帧 setState。
 *
 *   3. spring 预先采样成关键帧。
 *      WAAPI 没有原生弹簧，这里把 spring 物理积分成一串关键帧（含过冲），
 *      于是连「回弹」也跑在合成层。
 *
 * 三个组件：
 *   ① <Glyph>        字符级流体文本过渡（FLIP 滑动 + 进出场淡入淡出）
 *   ② <GlyphNumber>  平滑滚动计数（rAF 弹簧 + 直写 textContent）
 *   ③ <GlyphSlots>   老虎机数字轮（每位 0–9 竖列，合成层 translateY）
 * ============================================================================
 */

/* -------------------------------------------------------------------------- */
/* 通用：spring 预设 / 采样 / 工具                                              */
/* -------------------------------------------------------------------------- */

export type GlyphSpring = { stiffness?: number; damping?: number; mass?: number };

export const glyphSprings = {
  /** 默认：克制、顺滑，几乎不过冲。适合正文 / 标题。 */
  smooth: { stiffness: 220, damping: 26, mass: 1 } as GlyphSpring,
  /** 弹跳：有明显回弹，俏皮。适合需要「注意我」的数字 / 徽标。 */
  bouncy: { stiffness: 420, damping: 17, mass: 0.8 } as GlyphSpring,
  /** 舒缓：慢速、厚重。适合大字 hero。 */
  gentle: { stiffness: 120, damping: 24, mass: 1.1 } as GlyphSpring,
} as const;

/** SSR 安全的 layout effect（服务端退化成 useEffect，避免告警）。 */
const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function reducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * 把一段 spring 物理积分成「进度采样」。
 *
 * 返回 { duration, samples }：samples[i] 是在均匀时间点上的进度（0→1，
 * 欠阻尼时会越过 1 再回落 —— 这就是过冲/回弹）。任何属性按
 *   value = from + (to - from) * samples[i]
 * 生成关键帧，配合 easing:"linear"，即得到合成层上的弹簧动画。
 *
 * 按 (stiffness|damping|mass) 缓存，避免重复积分。
 */
const _springCache = new Map<string, { duration: number; samples: number[] }>();
function sampleSpring(spring?: GlyphSpring) {
  const k = spring?.stiffness ?? 220;
  const c = spring?.damping ?? 26;
  const m = spring?.mass ?? 1;
  const cacheKey = `${k}|${c}|${m}`;
  const hit = _springCache.get(cacheKey);
  if (hit) return hit;

  const fps = 60;
  const dt = 1 / fps;
  let x = 1; // 距目标的位移：1 → 0
  let v = 0;
  const samples: number[] = [0];
  const maxSteps = fps * 5; // 上限 5s 兜底
  for (let i = 0; i < maxSteps; i++) {
    // 半隐式欧拉积分，稳定且够用
    const a = (-k * x - c * v) / m;
    v += a * dt;
    x += v * dt;
    samples.push(1 - x);
    if (Math.abs(x) < 0.0008 && Math.abs(v) < 0.0008) break;
  }
  samples.push(1); // 收尾精确落在目标

  const result = { duration: Math.max(80, samples.length * dt * 1000), samples };
  _springCache.set(cacheKey, result);
  return result;
}

/**
 * 播放一段（合成层）WAAPI 动画并在结束/取消后把内联样式清干净，
 * 让元素回到「自然」静止态（不留 transform/opacity 残值）。
 */
function play(
  el: HTMLElement,
  keyframes: Keyframe[],
  duration: number,
  onDone?: () => void
) {
  // 取消同元素上未完成的动画，避免叠加打架
  el.getAnimations().forEach((a) => a.cancel());
  el.style.willChange = "transform, opacity";
  // fill:"both" → 第一帧前显示首关键帧、结束后保持末关键帧，首尾都不闪
  const anim = el.animate(keyframes, { duration, easing: "linear", fill: "both" });
  const cleanup = () => {
    el.style.transform = "";
    el.style.opacity = "";
    el.style.filter = "";
    el.style.willChange = "";
  };
  anim.onfinish = () => {
    cleanup();
    try {
      anim.cancel();
    } catch {}
    onDone?.();
  };
  anim.oncancel = cleanup;
  return anim;
}

/* -------------------------------------------------------------------------- */
/* ① <Glyph> —— 字符级流体文本过渡                                              */
/* -------------------------------------------------------------------------- */

type GlyphProps = {
  /** 要展示的文本。变化时自动做流体过渡。 */
  children: string;
  /** spring 预设或自定义。默认 glyphSprings.smooth。 */
  transition?: GlyphSpring;
  /**
   * 进出场的模糊强度（px）。默认 **0**。
   * 注意：filter:blur 动画不在合成层、会拖低帧率，仅在确实需要柔化时调大。
   */
  blur?: number;
  /**
   * 可选的纵向位移（px），默认 **0**。
   * 默认入场是方向中性的 scale+opacity；只有当你确实想要「从下方升入」时才设 >0。
   * 注意：居中文本里它会和水平重新居中的滑动叠加成多方向运动，慎用。
   */
  y?: number;
  /** 进出场的起始缩放（合成层、零成本的「弹入」手感）。默认 0.94。 */
  scaleFrom?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * 给每个字符算稳定 key（解决重复字符）：key = `${字符}#${第几次出现}`。
 *   "Craft"→ C#0 r#0 a#0 f#0 t#0 ；"Create"→ C#0 r#0 e#0 a#0 t#0 e#1
 * 共有的 C/r/a/t 被识别为同一元素 → FLIP 平滑移位；其余进/出场。
 */
function splitChars(text: string) {
  const seen: Record<string, number> = {};
  return Array.from(text).map((char) => {
    const n = seen[char] ?? 0;
    seen[char] = n + 1;
    return { key: `${char}#${n}`, char };
  });
}

const KEY_ATTR = "data-glyph-key";

// 入场 / 退场都是「方向中性」的 scale + opacity（原地淡入/淡出）。
// 不用竖直位移：字符位移只来自 FLIP 的水平重新居中，运动语言统一，不会四处乱飞。
// y 仅作为可选项保留（默认 0）；若 >0 才叠加竖直位移。
function enterKeyframes(y: number, blur: number, scaleFrom: number, samples: number[]): Keyframe[] {
  return samples.map((s) => {
    const inv = 1 - s;
    const sc = scaleFrom + (1 - scaleFrom) * s;
    const op = Math.min(1, Math.max(0, s));
    const transform = y ? `translateY(${y * inv}px) scale(${sc})` : `scale(${sc})`;
    return blur > 0
      ? { opacity: op, transform, filter: `blur(${blur * inv}px)` }
      : { opacity: op, transform };
  });
}

function exitKeyframes(y: number, blur: number, scaleFrom: number, samples: number[]): Keyframe[] {
  return samples.map((s) => {
    const sc = 1 - (1 - scaleFrom) * s;
    const op = Math.min(1, Math.max(0, 1 - s));
    const transform = y ? `translateY(${-y * s}px) scale(${sc})` : `scale(${sc})`;
    return blur > 0
      ? { opacity: op, transform, filter: `blur(${blur * s}px)` }
      : { opacity: op, transform };
  });
}

export function Glyph({
  children,
  transition = glyphSprings.smooth,
  blur = 0,
  y = 0,
  scaleFrom = 0.94,
  className,
  style,
}: GlyphProps) {
  const text = String(children ?? "");
  const chars = splitChars(text);

  const containerRef = useRef<HTMLSpanElement>(null);
  // 上一帧每个字符的屏幕位置 + 字符，用于 FLIP 和退场克隆
  const rectsRef = useRef(new Map<string, { left: number; top: number; char: string }>());
  const mountedRef = useRef(false);

  useIso(() => {
    const container = containerRef.current;
    if (!container) return;

    const contRect = container.getBoundingClientRect();
    const nodes = container.querySelectorAll<HTMLElement>(`[${KEY_ATTR}]`);

    // 关键：测量前先取消每个字符上「还没播完」的动画。
    // 否则 getBoundingClientRect 会把飞行中的 transform 也算进去，
    // 测出来的「新位置」被污染 → 算出的 FLIP 位移方向乱七八糟（快速输入时
    // 字母从四面八方乱入就是这个原因）。取消后拿到的是纯布局位置。
    nodes.forEach((node) => node.getAnimations().forEach((a) => a.cancel()));

    // —— 只读阶段：测量当前（=新文本最终布局，React 已移除退场字符）——
    const newRects = new Map<string, { left: number; top: number; char: string }>();
    const present = new Set<string>();
    const toEnter: HTMLElement[] = [];
    const toGlide: { node: HTMLElement; dx: number; dy: number }[] = [];

    nodes.forEach((node) => {
      const key = node.getAttribute(KEY_ATTR)!;
      const r = node.getBoundingClientRect();
      // 关键：存「相对容器」坐标，而不是「相对视口」坐标。
      // getBoundingClientRect 给的是视口坐标，会随页面滚动而变。若两帧之间发生
      // 了滚动，old(视口) - new(视口) 里就混进了滚动量，FLIP 位移凭空多出一段，
      // 字母便从「滚动偏移」处飘入而非它在画布里的真实旧位置。容器和字符一起
      // 滚动，相对容器的坐标恒定，dx/dy 只反映容器内的真实重排，与滚动解耦。
      const left = r.left - contRect.left;
      const top = r.top - contRect.top;
      newRects.set(key, { left, top, char: node.textContent ?? "" });
      present.add(key);
      const old = rectsRef.current.get(key);
      if (!old) toEnter.push(node);
      else {
        const dx = old.left - left;
        const dy = old.top - top;
        if (dx || dy) toGlide.push({ node, dx, dy });
      }
    });

    const exits: { left: number; top: number; char: string }[] = [];
    rectsRef.current.forEach((old, key) => {
      if (!present.has(key)) exits.push(old);
    });

    // 首次挂载：只记录位置，不播放入场（避免一加载就闪）
    if (!mountedRef.current) {
      mountedRef.current = true;
      rectsRef.current = newRects;
      return;
    }

    if (reducedMotion()) {
      rectsRef.current = newRects;
      return;
    }

    const { duration, samples } = sampleSpring(transition);

    // —— 写阶段：全部合成层动画 ——
    // 留下来的字符：FLIP，从旧位置滑到新位置（只动 transform）
    toGlide.forEach(({ node, dx, dy }) => {
      play(
        node,
        samples.map((s) => ({ transform: `translate(${dx * (1 - s)}px, ${dy * (1 - s)}px)` })),
        duration
      );
    });

    // 新字符：原地淡入 + 缩放弹入（方向中性，不和水平滑动打架）
    toEnter.forEach((node) => {
      play(node, enterKeyframes(y, blur, scaleFrom, samples), duration);
    });

    // 退场字符：用克隆节点绝对定位在原处淡出（不占布局、不动 React 状态）
    if (exits.length) {
      const exitDur = Math.max(120, duration * 0.8);
      const exitSamples = sampleSpring(transition).samples;
      exits.forEach((old) => {
        const clone = document.createElement("span");
        clone.textContent = old.char;
        clone.setAttribute("aria-hidden", "true");
        Object.assign(clone.style, {
          position: "absolute",
          // old.left/top 已是相对容器坐标（见上方测量），直接用作绝对定位偏移
          left: `${old.left}px`,
          top: `${old.top}px`,
          margin: "0",
          display: "inline-block",
          whiteSpace: "pre",
          pointerEvents: "none",
          willChange: "transform, opacity",
        } as Partial<CSSStyleDeclaration>);
        container.appendChild(clone);
        const anim = clone.animate(exitKeyframes(y, blur, scaleFrom, exitSamples), {
          duration: exitDur,
          easing: "linear",
          fill: "forwards",
        });
        const remove = () => clone.remove();
        anim.onfinish = remove;
        anim.oncancel = remove;
      });
    }

    rectsRef.current = newRects;
  }, [text]);

  return (
    <span
      ref={containerRef}
      className={className}
      style={{ display: "inline-flex", position: "relative", whiteSpace: "pre", ...style }}
    >
      {chars.map(({ key, char }) => (
        <span key={key} {...{ [KEY_ATTR]: key }} style={{ display: "inline-block", whiteSpace: "pre" }}>
          {char}
        </span>
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* ② <GlyphNumber> —— 平滑滚动计数（rAF 弹簧 + 直写 DOM）                        */
/* -------------------------------------------------------------------------- */

type GlyphNumberProps = {
  /** 目标数值。变化时用 spring 连续插值过去。 */
  value: number;
  /** 把插值过程中的浮点数格式化成显示文本。默认四舍五入取整。 */
  format?: (v: number) => string;
  transition?: GlyphSpring;
  className?: string;
  style?: React.CSSProperties;
};

export function GlyphNumber({
  value,
  format = (v) => Math.round(v).toString(),
  transition = glyphSprings.smooth,
  className,
  style,
}: GlyphNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const cur = useRef(value); // 当前显示到的数值
  const vel = useRef(0); // 速度
  const target = useRef(value);
  const raf = useRef(0);
  const lastStr = useRef<string | null>(null);
  const fmt = useRef(format);
  fmt.current = format;
  const spring = useRef(transition);
  spring.current = transition;
  // 初始文本冻结成常量：React 永远渲染同一个字符串，不会覆盖我们 rAF 写入的 textContent
  const [initial] = useState(() => format(value));

  useEffect(() => {
    target.current = value;
    if (reducedMotion()) {
      cur.current = value;
      const s = fmt.current(value);
      if (ref.current && s !== lastStr.current) {
        ref.current.textContent = s;
        lastStr.current = s;
      }
      return;
    }
    if (raf.current) return; // 已有循环在跑，改 target 即可

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.064, (now - last) / 1000);
      last = now;
      const { stiffness = 220, damping = 26, mass = 1 } = spring.current ?? {};
      const x = cur.current - target.current;
      const a = (-stiffness * x - damping * vel.current) / mass;
      vel.current += a * dt;
      cur.current += vel.current * dt;
      if (Math.abs(cur.current - target.current) < 0.0005 && Math.abs(vel.current) < 0.0005) {
        cur.current = target.current;
        vel.current = 0;
      }
      const s = fmt.current(cur.current);
      if (ref.current && s !== lastStr.current) {
        ref.current.textContent = s;
        lastStr.current = s;
      }
      if (cur.current === target.current) {
        raf.current = 0;
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [value]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {initial}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* ③ <GlyphSlots> —— 老虎机 / 里程表数字轮（合成层 translateY）                  */
/* -------------------------------------------------------------------------- */

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** 单位数字轮：0–9 竖列，靠合成层 translateY 把目标数字滚进 1em 视窗。 */
function Reel({ digit, spring }: { digit: number; spring: GlyphSpring }) {
  const colRef = useRef<HTMLSpanElement>(null);
  const prev = useRef(digit);
  // 冻结挂载时的初始位移，避免 React 在每次 re-render 覆盖我们用 WAAPI 写入的 transform
  const [mountTransform] = useState(() => `translateY(${-digit}em)`);

  useIso(() => {
    const col = colRef.current;
    if (!col) return;
    const from = prev.current;
    const to = digit;
    prev.current = to;
    if (from === to) {
      col.style.transform = `translateY(${-to}em)`;
      return;
    }
    if (reducedMotion()) {
      col.style.transform = `translateY(${-to}em)`;
      return;
    }
    const { duration, samples } = sampleSpring(spring);
    col.getAnimations().forEach((a) => a.cancel());
    const anim = col.animate(
      samples.map((s) => ({ transform: `translateY(${-(from + (to - from) * s)}em)` })),
      { duration, easing: "linear", fill: "both" }
    );
    anim.onfinish = () => {
      col.style.transform = `translateY(${-to}em)`; // 落定后写回内联，释放动画占用
      try {
        anim.cancel();
      } catch {}
    };
  }, [digit]);

  return (
    <span
      style={{
        display: "inline-block",
        height: "1em",
        lineHeight: "1em",
        overflow: "hidden",
        verticalAlign: "-0.06em",
      }}
    >
      <span ref={colRef} style={{ display: "block", transform: mountTransform }}>
        {DIGITS.map((d) => (
          <span key={d} style={{ display: "block", height: "1em", lineHeight: "1em" }}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

type GlyphSlotsProps = {
  /** 要展示的数值。 */
  value: number;
  /**
   * 把数值格式化成字符串（可含 $ , . 等符号）。
   * 字符串里的数字会变成滚轮，其它字符原样静态显示。默认带千分位。
   */
  format?: (v: number) => string;
  transition?: GlyphSpring;
  className?: string;
  style?: React.CSSProperties;
};

export function GlyphSlots({
  value,
  format = (v) => v.toLocaleString("en-US"),
  transition = glyphSprings.bouncy,
  className,
  style,
}: GlyphSlotsProps) {
  const text = format(value);

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "pre",
        ...style,
      }}
    >
      {Array.from(text).map((ch, i) =>
        /\d/.test(ch) ? (
          <Reel key={i} digit={Number(ch)} spring={transition} />
        ) : (
          <span key={i} style={{ display: "inline-block" }}>
            {ch}
          </span>
        )
      )}
    </span>
  );
}
