"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import type { Transition } from "framer-motion";

/**
 * ============================================================================
 * Glyph · 流体文本动画库
 * ============================================================================
 *
 * 灵感来自 calligraph.raphaelsalaja.com（"Fluid text transitions powered by Motion"）。
 * 这是一个不依赖任何第三方、只用 framer-motion(=motion.js) 重写的同类实现。
 *
 * 三个核心组件，对应三种「文字会动」的场景：
 *
 *   ① <Glyph>        文本流体过渡。文字内容变化时，相同字符平滑移位，
 *                    新字符「模糊 + 上浮」淡入，消失字符「模糊 + 上浮」淡出，
 *                    整行宽度也跟着做 layout 动画。适合标题 / 状态文案切换。
 *
 *   ② <GlyphNumber>  平滑数字。给一个目标 value，用 spring 把数值连续插值过去，
 *                    像计数器一样滚动。适合金额 / 统计数字。
 *
 *   ③ <GlyphSlots>   老虎机数字轮。每一位数字是一根 0–9 的竖列，
 *                    translateY 落到目标数字，像里程表 / 机场翻牌。
 *                    适合价格 / 倒计时这种「机械感」的数字。
 *
 * 设计原则：
 *   - 纯 transform / opacity / filter 动画，GPU 友好。
 *   - 所有动效都走 spring，统一的「流体」手感（见 glyphSprings）。
 *   - 组件只关心动画，格式化交给调用方（传 format 函数），保持通用。
 * ============================================================================
 */

/* -------------------------------------------------------------------------- */
/* Spring 预设：整库共用，保证手感一致                                          */
/* -------------------------------------------------------------------------- */

export const glyphSprings = {
  /** 默认：克制、顺滑，几乎不过冲。适合正文 / 标题。 */
  smooth: { type: "spring", stiffness: 220, damping: 26, mass: 1 } as Transition,
  /** 弹跳：有明显回弹，俏皮。适合需要「注意我」的数字 / 徽标。 */
  bouncy: { type: "spring", stiffness: 420, damping: 17, mass: 0.8 } as Transition,
  /** 舒缓：慢速、厚重。适合大字 hero。 */
  gentle: { type: "spring", stiffness: 120, damping: 24, mass: 1.1 } as Transition,
} as const;

/* -------------------------------------------------------------------------- */
/* ① <Glyph> —— 字符级流体文本过渡                                              */
/* -------------------------------------------------------------------------- */

type GlyphProps = {
  /** 要展示的文本。变化时自动做流体过渡。 */
  children: string;
  /** spring 预设或自定义 transition。默认 glyphSprings.smooth。 */
  transition?: Transition;
  /** 进出场的模糊强度（px）。默认 6。 */
  blur?: number;
  /** 进出场的纵向位移（px）。字符从下方升入、向上方退出。默认 10。 */
  y?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * 给每个字符算一个「稳定 key」。
 *
 * 难点：重复字符。如果只用字符本身当 key，"aa" 就会撞 key。
 * 解法：key = `${字符}#${它是第几次出现}`。
 *   "Craft" → C#0 r#0 a#0 f#0 t#0
 *   "Create"→ C#0 r#0 e#0 a#0 t#0 e#1
 * 这样两词共有的 C/r/a/t 会被 AnimatePresence 识别为「同一个元素」，
 * 从而平滑移动到新位置；f#0 退出，e#0/e#1 进入。这正是「流体」的来源。
 */
function splitChars(text: string) {
  const seen: Record<string, number> = {};
  return Array.from(text).map((char) => {
    const n = seen[char] ?? 0;
    seen[char] = n + 1;
    return { key: `${char}#${n}`, char };
  });
}

export function Glyph({
  children,
  transition = glyphSprings.smooth,
  blur = 6,
  y = 10,
  className,
  style,
}: GlyphProps) {
  const chars = splitChars(children);

  return (
    // 外层 layout：当字符增减导致宽度变化时，整体宽度平滑过渡。
    // position:relative 给 popLayout 退场字符的绝对定位投影一个定位上下文。
    <motion.span
      layout
      className={className}
      style={{ display: "inline-flex", position: "relative", whiteSpace: "pre", ...style }}
    >
      {/*
        mode="popLayout"：退出中的元素立刻脱离正常布局（配合 exit 的
        position:absolute），让留下的字符可以马上 layout 动画到新位置，
        不会等退场动画放完才挪动 —— 这是「流体」不卡顿的关键。
        initial={false}：首次挂载不播放入场动画，避免页面一加载就闪一下。
      */}
      <AnimatePresence mode="popLayout" initial={false}>
        {chars.map(({ key, char }) => (
          <motion.span
            key={key}
            layout
            initial={{ opacity: 0, filter: `blur(${blur}px)`, y }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            // 不要手动写 position:absolute —— mode="popLayout" 会自己把退场字符
            // 投影成绝对定位并保持在原位，手动覆盖会让它塌缩到容器原点 / 乱飞。
            exit={{ opacity: 0, filter: `blur(${blur}px)`, y: -y }}
            transition={transition}
            style={{ display: "inline-block", whiteSpace: "pre" }}
          >
            {char}
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.span>
  );
}

/* -------------------------------------------------------------------------- */
/* ② <GlyphNumber> —— 平滑滚动数字（计数器）                                     */
/* -------------------------------------------------------------------------- */

type GlyphNumberProps = {
  /** 目标数值。变化时用 spring 连续插值过去。 */
  value: number;
  /** 把插值过程中的浮点数格式化成显示文本。默认四舍五入取整。 */
  format?: (v: number) => string;
  transition?: Transition;
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
  // 用一个 motion value 承载「当前显示到的数值」，animate() 负责把它推向目标。
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState(() => format(value));
  // 用 ref 持有最新 format，避免把它放进 effect 依赖导致频繁重启动画。
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    const unsub = mv.on("change", (v) => setDisplay(formatRef.current(v)));
    const controls = animate(mv, value, transition as Parameters<typeof animate>[2]);
    return () => {
      controls.stop();
      unsub();
    };
    // 只在目标值变化时重启动画。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {display}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* ③ <GlyphSlots> —— 老虎机 / 里程表数字轮                                       */
/* -------------------------------------------------------------------------- */

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** 单个数字位：一根 0–9 的竖列，靠 translateY 把目标数字滚到可视窗口里。 */
function Reel({ digit, transition }: { digit: number; transition: Transition }) {
  return (
    // 视窗高度 = 1em，overflow:hidden 只露出一个数字。
    <span
      style={{
        display: "inline-block",
        height: "1em",
        lineHeight: "1em",
        overflow: "hidden",
        verticalAlign: "-0.06em", // 微调，让数字基线和旁边的 $ , . 对齐
      }}
    >
      {/*
        竖列共 10 个数字格、每格 1em 高，总高 10em。
        y = -digit em → 第 digit 个格子正好停在视窗里。
        负方向位移用 spring，9→0 这种会顺时针滚一长段，正是老虎机的感觉。
      */}
      <motion.span
        style={{ display: "block" }}
        animate={{ y: `-${digit}em` }}
        transition={transition}
      >
        {DIGITS.map((d) => (
          <span key={d} style={{ display: "block", height: "1em", lineHeight: "1em" }}>
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

type GlyphSlotsProps = {
  /** 要展示的数值。 */
  value: number;
  /**
   * 把数值格式化成字符串（可含 $ , . 等符号）。
   * 字符串里的数字会变成滚轮，其它字符原样静态显示。
   * 默认带千分位。
   */
  format?: (v: number) => string;
  transition?: Transition;
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
          <Reel key={i} digit={Number(ch)} transition={transition} />
        ) : (
          // 非数字符号（$ , .）静态显示。
          <span key={i} style={{ display: "inline-block" }}>
            {ch}
          </span>
        )
      )}
    </span>
  );
}
