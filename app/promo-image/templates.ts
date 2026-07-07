/**
 * 宣传图工具 · 手写模板（template-as-data）
 * ============================================================================
 * v1 手写这几套版式。每套只描述布局 + 样式，不含文字本身（文字靠 `bind` 从
 * content 取）。三套版式共同点：文字都落在着色器区域（而非压在图片上），靠深色
 * colorBack 保证白字清晰 —— 这样无需描边 / 蒙版（v1 明确不做）也始终可读。
 *
 * phase-2 的「AI 排版」= 让模型按同一 schema 多吐几个这样的对象，渲染器 / 导出
 * 管线一行不改。
 */

import type { Template } from "./types";

/** 统一字体栈：Geist（拉丁，next/font 全局注入）+ 系统中文回退 */
export const FONT_SANS =
  'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Segoe UI", sans-serif';

export const templates: Template[] = [
  /* —— 1. Editorial：大图在上，标题 + 说明落在下方着色器区（默认） —— */
  {
    id: "editorial",
    name: "Editorial · 图在上",
    artboard: { ratio: "4:5" },
    layers: [
      {
        type: "shader",
        shader: "grain",
        colors: ["#7c3aed", "#4f46e5", "#06b6d4", "#22d3ee"],
        colorBack: "#0a0a14",
        shape: "corners",
        softness: 0.7,
        intensity: 0.5,
        noise: 0.28,
        speed: 0.5,
      },
      {
        type: "image",
        bind: "image",
        frame: { x: 6, y: 6, w: 88, h: 58 },
        fit: "cover",
        radius: 32,
      },
      {
        type: "text",
        bind: "title",
        frame: { x: 6.5, y: 68, w: 76, h: 17 },
        font: FONT_SANS,
        size: 84,
        weight: 700,
        color: "#ffffff",
        align: "left",
        lineHeight: 1.08,
        letterSpacing: -1,
      },
      {
        type: "text",
        bind: "caption",
        frame: { x: 6.5, y: 86, w: 82, h: 9.5 },
        font: FONT_SANS,
        size: 28,
        weight: 400,
        color: "rgba(255,255,255,0.72)",
        align: "left",
        lineHeight: 1.4,
      },
    ],
  },

  /* —— 2. Spotlight：居中圆形图 + 居中标题 / 说明，适合方形头像式封面 —— */
  {
    id: "spotlight",
    name: "Spotlight · 居中",
    artboard: { ratio: "1:1" },
    layers: [
      {
        type: "shader",
        shader: "grain",
        colors: ["#f97316", "#ef4444", "#db2777", "#a855f7"],
        colorBack: "#120810",
        shape: "blob",
        softness: 0.8,
        intensity: 0.55,
        noise: 0.26,
        speed: 0.45,
      },
      {
        type: "image",
        bind: "image",
        frame: { x: 33, y: 11, w: 34, h: 34 },
        fit: "cover",
        radius: 999, // 大圆角 → 圆形
      },
      {
        type: "text",
        bind: "title",
        frame: { x: 8, y: 52, w: 84, h: 20 },
        font: FONT_SANS,
        size: 82,
        weight: 700,
        color: "#ffffff",
        align: "center",
        lineHeight: 1.1,
        letterSpacing: -1,
      },
      {
        type: "text",
        bind: "caption",
        frame: { x: 14, y: 74, w: 72, h: 12 },
        font: FONT_SANS,
        size: 27,
        weight: 400,
        color: "rgba(255,255,255,0.74)",
        align: "center",
        lineHeight: 1.45,
      },
    ],
  },

  /* —— 3. Banner：左图右字，适合横版 / 竖版通投 —— */
  {
    id: "banner",
    name: "Banner · 左图右字",
    artboard: { ratio: "1.91:1" },
    layers: [
      {
        type: "shader",
        shader: "grain",
        colors: ["#0ea5e9", "#3b82f6", "#14b8a6", "#22d3ee"],
        colorBack: "#07101a",
        shape: "ripple",
        softness: 0.65,
        intensity: 0.5,
        noise: 0.24,
        speed: 0.5,
      },
      {
        type: "image",
        bind: "image",
        frame: { x: 5, y: 9, w: 42, h: 82 },
        fit: "cover",
        radius: 28,
      },
      {
        type: "text",
        bind: "title",
        frame: { x: 53, y: 20, w: 42, h: 40 },
        font: FONT_SANS,
        size: 62,
        weight: 700,
        color: "#ffffff",
        align: "left",
        lineHeight: 1.1,
        letterSpacing: -0.5,
      },
      {
        type: "text",
        bind: "caption",
        frame: { x: 53, y: 62, w: 42, h: 24 },
        font: FONT_SANS,
        size: 25,
        weight: 400,
        color: "rgba(255,255,255,0.72)",
        align: "left",
        lineHeight: 1.45,
      },
    ],
  },
];

export const defaultTemplate = templates[0];
