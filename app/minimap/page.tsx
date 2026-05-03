"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Chat TOC · 时间线高亮
 *
 * TOC 方案探索：左侧时间线轨道作为对话索引。
 * - Each node = ONE message, with H2 sub-nodes below.
 * - Select text in content -> create highlight badge on the timeline.
 * - Click message node -> jump to message.
 * - Click H2 -> jump to that section.
 * - Click highlight badge -> popover list; click entry -> jump to mark.
 */

// ----------------------------
// Types
// ----------------------------

type Role = "user" | "ai";

type Message = {
  id: string;
  role: Role;
  content: string;
};

type BlockType = "h1" | "h2" | "h3" | "p";

type Block = {
  id: string;
  type: BlockType;
  text: string;
  index: number;
};

type Highlight = {
  id: string;
  messageId: string;
  blockId: string;
  start: number;
  end: number;
  excerpt: string;
  createdAt: number;
};

type H2Node = {
  id: string;
  messageId: string;
  blockId: string;
  title: string;
  blockIndex: number;
  scopeEndBlockIndex: number;
};

type MessageNav = {
  message: Message;
  title: string; // derived from first H1, else fallback
  h2: H2Node[];
};

type PopoverState =
  | null
  | {
      kind: "message" | "h2";
      messageId: string;
      h2Id?: string;
    };

// ----------------------------
// Demo Data (4–6 H2 each + longer content)
// ----------------------------

const demoMessages: Message[] = [
  {
    id: "m1",
    role: "user",
    content: `# 需求概述

我们现在有一个 chatbot, 对话记录可能在 2 到 50 条之间。每条消息是一个独立的 markdown 片段, 包含正文与标题 (H1/H2/H3)。

## 背景与动机

我不想让目录占据太多空间, 也不想它像一个 sidebar。更理想的体验是: 内容优先、导航轻量、交互自然, 类似 Apple 的细节、Vercel/Next 的克制。

为了压力测试滚动联动, 这里故意写得更长一些: 我希望你能在连续滚动很多屏的情况下, 仍然看到 active 节点跟随变化, 并且点击节点跳转后不会丢失上下文。也就是说, 这个“导航”要像一把细尺, 而不是一个抽屉。

## 目标与范围

目标是把每条消息以及消息中的 H1/H2/H3 抽取出来, 但导航只展示 message 的主标题 (H1) 与二级标题 (H2)。H3 不在 timeline 展示, 但它会影响 H2 的内容分段与高亮归属。

## 数据结构

- message: { id, role, content }
- content: markdown 片段
- headings: 从 content 提取 H1/H2/H3
- highlights: 用户在正文里划选并高亮的片段 (仅高亮, 不做 memo)

补充一段更长的描述: highlights 需要能映射到 message, 也需要能映射到某个 section(H2) 的范围内, 这样 timeline 才能在 message 节点与 H2 行上都显示计数。你在测试时可以在同一段落里打多个 highlight, 看 pieces 渲染是否稳定。

## 交互目标

1. 点击圆点: 跳转到对应 message
2. hover/active: 展开该 message 的 H2 列表
3. 点击 H2: 跳转到对应标题位置
4. 点击高亮数量: 弹出 popover, 展示该 message 或该 H2 区域内的高亮列表

## 边界与验收

需要用长内容测试滚动联动: 多屏滚动时 active node 仍准确, 跳转落点稳定, popover 不遮挡关键内容。并且 “展开/收起” 不要出现你之前说的那种先压缩再撑高的糟糕体验。

## 体验细节

对话天然是时间序列, timeline 更符合心智模型。用户滚动阅读时, 希望导航像一个进度尺一样同步移动, 而不是频繁开合面板。`,
  },
  {
    id: "m2",
    role: "ai",
    content: `# 信息结构与解析

我们把每条消息当作一篇 mini 文档来处理。解析时只做最小假设: 按行扫描 markdown, 识别 #/##/### 三个层级, 其余合并为段落。

## 标题提取规则

- # -> H1 (message 的主标题)
- ## -> H2 (timeline 展示的二级标题)
- ### -> H3 (不在 timeline 展示, 但会影响 H2 的作用域)

## H2 作用域

H2 的作用域从它自身开始, 直到遇到下一个 level <= 2 的标题 (即下一个 H2 或 H1) 为止。这样我们能把高亮映射到属于哪个 H2 区块。

为了更真实地模拟文档, 每个 H2 下也写一些段落。段落越长, 对 offset 计算、滚动定位与 popover 定位的压力就越大。你可以选中某一段中的任意子串去高亮, 再从 popover 跳回来。

## 解析步骤

1) split lines
2) 识别 heading 行, flush 段落
3) 生成 blocks (h1/h2/h3/p)
4) 从 blocks 生成 nav (message title + h2 list)

## 边界情况

1. 没有 H1: 用正文前 28 个字符作为 fallback title
2. H2 很多: timeline 默认折叠, 仅 hover/active 展开
3. 标题很长: timeline 里截断, 保留 title 属性用于悬浮查看

## 示例输出

- nav: [{ messageId, title, h2: [{ title, blockIndex, scopeEndBlockIndex }] }]
- blocksByMessage: { [messageId]: blocks[] }

## 复杂度

解析是 O(n) 线性扫描, n 为字符/行数。避免引入 markdown AST, 让 demo 轻量可读, 也更容易被你拿去集成到真实工程里。`,
  },
  {
    id: "m3",
    role: "ai",
    content: `# 视觉与动效

整体风格偏 Next/Vercel: 灰阶、轻边框、弱阴影、少色彩; 交互细节偏 Apple: 轻微动效反馈、跳转后的状态提示、克制但精致。

## 色彩与层级

主色保持中性, 黄色只用于 highlight 信息提示。节点与线条尽量轻, 让内容成为焦点。你会发现只要信息层级清晰, timeline 不需要“很大”也能有足够的存在感。

## Timeline 结构

左侧是 1 列窄布局:
- 竖向连接线把每个节点串起来
- 圆点是主交互入口 (跳转 message)
- 高亮 badge 是信息提示 + popover 入口

## 对齐与密度

圆点与 H1 title 必须严格对齐, 避免视觉抖动。H2 列表在 hover/active 时展开, 使用高度动画但不压缩其他布局。要保证展开发生时不会“推挤”到别的节点从而看起来像压缩再撑高。

## 动效策略

- 展开: height 从 0 -> auto, opacity 渐入
- 跳转高亮: mark pulse (opacity/ring)
- popover: 从 badge 位置弹出, fixed 定位

## 可访问性

hover 只是辅助, 核心动作都可以 click 完成。未来建议加 aria-label 与键盘导航 (上下切节点, Enter 跳转)。

## 响应式

lg 以上显示 timeline, 小屏可考虑隐藏或换成顶部轻量跳转控件。当前 demo 只实现 lg 显示。`,
  },
  {
    id: "m4",
    role: "user",
    content: `# 高亮交互

我会在内容区域划选文本, 然后点击 Highlight 创建高亮。这里不做 memo, 只做纯高亮即可。

## 选择策略

仅支持在同一个 block (同一段落或同一标题行) 内 selection。跨 block selection 直接忽略。这样能避免复杂 DOM range 映射, 让 demo 更稳。

## 偏移计算

用 TreeWalker 线性遍历文本节点, 计算 start/end 偏移。存储时只记录偏移, 不记录 DOM。

为了让测试更接近真实, 这里写更长的段落: selection 的 start/end 偏移必须能在重新渲染后仍然指向同一段文本, 否则高亮会漂移。对于特别长的段落, 也要避免 offset 计算出现性能问题。你可以反复选中不同位置创建多个高亮, 看渲染是否仍稳定。

## 渲染策略

用 <mark> 包裹高亮段, 按 start/end 切分文本为 pieces。多个高亮需要按 start 排序并处理重叠。

## Popover 信息

popover 里展示 excerpt (截断到 70 字), 按时间倒序。点击某项: 关闭 popover, 跳转到 mark 并强调。

## 跳转反馈

跳转到 mark 后, 需要一个短暂的强调效果, 让用户能立即定位到落点。我们用 ring + opacity pulse 来实现。

## 常见问题

长段落时 selection offset 仍要稳定。滚动定位要考虑 sticky header, 可用 scroll-mt-* 做基础处理。`,
  },
  {
    id: "m5",
    role: "ai",
    content: `# Scroll 联动与性能

我们用 IntersectionObserver 做 scroll-spy: 当某条 message 的卡片进入可视区域时, 把 timeline 的 active node 切换到它。

## 观察策略

- threshold 设为 0.2
- rootMargin 上负下负, 让 active 更贴合阅读视窗

## 触发阈值

阈值不是越小越好, 太敏感会抖动。我们用 0.2 配合 rootMargin, 在长文档里通常更稳定。你可以快速滚动看看 active 变化是否自然。

## 抖动处理

如果内容很长, active 可能来回切换。可以引入 hysteresis 或把 active 设为最靠近顶部的 intersecting 元素。这里 demo 用“最靠近顶部”排序法。

## 跳转体验

message/H2/mark 都用 scrollIntoView smooth。H2 容器加 scroll-mt-24 预留顶部空间, 避免标题被顶到屏幕上沿看不见。

## Popover 定位

popover 用 fixed, anchor 取点击 badge 的 rect。右侧优先, 不足则贴边。y 方向限制在视窗内。

## 性能清单

只观察 message 容器, 不观察每个 block。高亮渲染只在对应 block 内切分, 避免全局重排。`,
  },
  {
    id: "m6",
    role: "ai",
    content: `# 结构可扩展性

虽然当前 demo 只做高亮, 但结构上应当允许未来扩展: memo、标签、导出、持久化等。

## 扩展方向

- memo: 高亮上挂备注 (可选)
- 标签: Bug/Idea/Todo
- 搜索: timeline 快速过滤 message/h2

## 数据持久化

未来可以把 highlights 存到 localStorage 或后端。key 可组合 conversationId + messageId。这里 demo 不做持久化, 但数据结构已经适配。

## 组件划分

- TimelineRail
- ContentColumn
- SelectionToolbar
- FloatingPopover

## 状态管理

当前用 useState + useMemo。产品化可抽 hook (useHighlights/useScrollSpy/usePopover)。你也可以把 “parseBlocks/buildNav” 抽到 utils 里。

## 可测试性

纯函数部分 (parseBlocks/buildNav) 可以用 console.assert 或单元测试框架验证。交互部分可用 e2e 或 storybook。

## 风险点

节点密度高时 hover 展开会很挤, 可以限制展开数量或只在 active 时完整展开。`,
  },
  {
    id: "m7",
    role: "user",
    content: `# 测试清单

我会用这份 demo 做压力测试, 所以需要每条消息内容足够长且 H2 较多。

## 滚动测试

快速滚动: active node 不应乱跳。慢速滚动: active node 应紧跟阅读位置。中速滚动: 不要频繁在两个节点之间抖动。

## 点击跳转

点击 message 圆点、H2 标题、popover 高亮项, 都应稳定跳转并且落点准确。跳转后要保持阅读上下文, 不要出现“跳过去但看不到重点”的情况。

## 高亮测试

短 selection / 长 selection。标题行高亮 / 长段落高亮。多个高亮同段落渲染稳定, 不要错位、不重叠、不丢字符。

## Popover 测试

popover 在视窗底部/右侧边缘时不能溢出。点击外部关闭, Esc 关闭。重复点同一个 badge 应切换开关。

## 极端场景

增加到 30~50 条 message, 每条 4~6 个 H2, 仍应流畅。你可以复制 demoMessages 增加数量做更极端测试。

## 交互一致性

hover 展开与 active 展开要一致, 不要出现突然闪烁或布局抖动。`,
  },
  {
    id: "m8",
    role: "ai",
    content: `# 下一步

如果 demo 的滚动联动与交互稳定, 下一步可以考虑把它变成可复用组件。

## 设计精修

active 连接线加深形成 progress rail。hover 态更细腻, 但保持克制。可以对 active 的 dot 做更轻的视觉强调。

## 功能扩展

支持 memo, 支持标签, 支持搜索过滤, 支持导出高亮摘要。memo 的展示可以在 popover 里做二级展开。

## 工程化

把解析与导航构建抽到独立模块, 并加单元测试。把滚动与 popover 逻辑抽为 hooks。把 anchor 计算、边界限制封装成 util。

## 导出与分享

把高亮聚合成摘要, 或导出为 markdown/JSON。甚至可以把每个 H2 的 highlights 做一个自动摘要输出。

## 打磨细节

让跳转后的落点更清晰, 让 popover 的打开关闭更稳定, 并考虑将来加键盘导航与可访问性属性。

## 交付标准

DRY、组件化、交互自然、样式克制。确保在不同内容长度下都稳定。`,
  },
];

// ----------------------------
// Utilities
// ----------------------------

function uid(prefix = "id") {
  const r =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? (crypto as any).randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${r}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getHeadingLevel(type: BlockType): 1 | 2 | 3 | null {
  if (type === "h1") return 1;
  if (type === "h2") return 2;
  if (type === "h3") return 3;
  return null;
}

function parseBlocks(message: Message): Block[] {
  const lines = message.content.split("\n").map((l) => l.replace(/\s+$/g, ""));
  const blocks: Block[] = [];
  let buffer: string[] = [];

  const flushParagraph = () => {
    const text = buffer.join(" ").trim();
    if (text) blocks.push({ id: uid(`${message.id}_b`), type: "p", text, index: blocks.length });
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.*)$/);
    const h2 = trimmed.match(/^##\s+(.*)$/);
    const h1 = trimmed.match(/^#\s+(.*)$/);

    if (h1 || h2 || h3) {
      flushParagraph();
      const type: BlockType = h1 ? "h1" : h2 ? "h2" : "h3";
      const text = (h1?.[1] ?? h2?.[1] ?? h3?.[1] ?? "").trim();
      blocks.push({ id: uid(`${message.id}_b`), type, text, index: blocks.length });
    } else {
      buffer.push(trimmed);
    }
  }

  flushParagraph();
  return blocks.map((b, i) => ({ ...b, index: i }));
}

function computeOffsetWithinElement(el: HTMLElement, container: Node, nodeOffset: number): number {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let current = walker.nextNode();

  while (current) {
    if (current === container) return offset + nodeOffset;
    offset += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }

  return offset;
}

function getSelectionOffsetsWithin(el: HTMLElement, range: Range): { start: number; end: number } | null {
  if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return null;
  const a = computeOffsetWithinElement(el, range.startContainer, range.startOffset);
  const b = computeOffsetWithinElement(el, range.endContainer, range.endOffset);
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  return start === end ? null : { start, end };
}

function excerptFor(text: string, start: number, end: number) {
  const s = clamp(start, 0, text.length);
  const e = clamp(end, 0, text.length);
  const raw = text.slice(s, e).trim();
  return raw.length > 70 ? raw.slice(0, 70) + "…" : raw;
}

function groupBy<T, K extends string>(items: T[], keyFn: (t: T) => K): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const k = keyFn(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

function buildNav(messages: Message[]): {
  blocksByMessage: Record<string, Block[]>;
  nav: MessageNav[];
} {
  const blocksByMessage: Record<string, Block[]> = {};

  const nav: MessageNav[] = messages.map((m) => {
    const blocks = parseBlocks(m);
    blocksByMessage[m.id] = blocks;

    const firstH1 = blocks.find((b) => b.type === "h1")?.text;
    const fallback = (blocks.find((b) => b.text)?.text ?? m.id).slice(0, 28);
    const title = firstH1 || fallback;

    const headingIndices = blocks
      .map((b, idx) => ({ b, idx }))
      .filter(({ b }) => getHeadingLevel(b.type) !== null);

    // Build only H2 nodes, scope = until next heading level <= 2
    const h2Nodes: H2Node[] = [];
    for (let i = 0; i < headingIndices.length; i++) {
      const { b, idx } = headingIndices[i];
      const level = getHeadingLevel(b.type)!;
      if (level !== 2) continue;

      let end = blocks.length - 1;
      for (let j = i + 1; j < headingIndices.length; j++) {
        const nextLevel = getHeadingLevel(headingIndices[j].b.type)!;
        if (nextLevel <= 2) {
          end = headingIndices[j].idx - 1;
          break;
        }
      }

      h2Nodes.push({
        id: uid(`${m.id}_h2`),
        messageId: m.id,
        blockId: b.id,
        title: b.text,
        blockIndex: idx,
        scopeEndBlockIndex: Math.max(idx, end),
      });
    }

    return { message: m, title, h2: h2Nodes };
  });

  return { blocksByMessage, nav };
}

// ----------------------------
// Dev self-tests (no framework required)
// ----------------------------

function runDevSelfTests() {
  // Existing tests (kept)
  const blocks = parseBlocks({ id: "t1", role: "ai", content: "# A\n\nHello\n\n## B\n\nWorld\n\n### C\n\nEnd" });
  console.assert(blocks.some((b) => b.type === "h1" && b.text === "A"), "Expected H1 A");
  console.assert(blocks.some((b) => b.type === "h2" && b.text === "B"), "Expected H2 B");

  const { nav } = buildNav([{ id: "t2", role: "ai", content: "# A\n\nX\n\n## B\n\nY\n\n## C\n\nZ" }]);
  console.assert(nav[0]?.h2?.length === 2, "Expected two H2 nodes");

  // Added tests
  const { blocksByMessage, nav: nav2 } = buildNav([
    {
      id: "t3",
      role: "ai",
      content: "# A\n\nP\n\n## B\n\nQ\n\n### B.1\n\nR\n\n## C\n\nS",
    },
  ]);
  const t3 = nav2[0];
  console.assert(!!t3.title && t3.title === "A", "Expected title derived from first H1");
  console.assert(t3.h2.length === 2, "Expected two H2 nodes in t3");

  const t3Blocks = blocksByMessage["t3"];
  const bNode = t3.h2[0];
  const cNode = t3.h2[1];
  console.assert(bNode.scopeEndBlockIndex < cNode.blockIndex, "Expected H2 scope to end before next H2 begins");
  console.assert(
    t3Blocks[bNode.blockIndex]?.type === "h2" && t3Blocks[cNode.blockIndex]?.type === "h2",
    "Expected H2 nodes to point to h2 blocks"
  );

  // Added: fallback title if no H1
  const { nav: nav3 } = buildNav([{ id: "t4", role: "ai", content: "No title here\n\n## B\n\nX" }]);
  console.assert(typeof nav3[0].title === "string" && nav3[0].title.length > 0, "Expected fallback title");

  // Added: many H2 for stress
  const { nav: nav4 } = buildNav([
    {
      id: "t5",
      role: "ai",
      content: "# A\n\nP\n\n## S1\n\nX\n\n## S2\n\nX\n\n## S3\n\nX\n\n## S4\n\nX\n\n## S5\n\nX",
    },
  ]);
  console.assert(nav4[0].h2.length === 5, "Expected five H2 nodes in stress case");
}

// ----------------------------
// UI atoms
// ----------------------------

function SelectionToolbar({
  open,
  x,
  y,
  onHighlight,
  onDismiss,
}: {
  open: boolean;
  x: number;
  y: number;
  onHighlight: () => void;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.14 }}
          style={{ left: x, top: y }}
          className="fixed z-50"
          data-selection-toolbar
        >
          <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white/95 p-1 shadow-lg backdrop-blur">
            <button
              onClick={onHighlight}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-100"
            >
              Highlight
            </button>
            <button onClick={onDismiss} className="rounded-lg px-2.5 py-1 text-xs text-zinc-600 hover:bg-zinc-100">
              Dismiss
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FloatingPopover({
  open,
  anchor,
  title,
  items,
  onPick,
  onClose,
}: {
  open: boolean;
  anchor: { x: number; y: number } | null;
  title: string;
  items: Highlight[];
  onPick: (h: Highlight) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && anchor && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.99 }}
          transition={{ duration: 0.14 }}
          className="fixed z-50 w-64"
          style={{ left: anchor.x, top: anchor.y }}
          data-highlight-popover
        >
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-lg">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="text-xs font-medium text-zinc-900">{title}</div>
              <button onClick={onClose} className="rounded-lg px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100">
                Close
              </button>
            </div>
            <div className="max-h-60 overflow-auto px-2 pb-2">
              {items.length === 0 ? (
                <div className="px-2 py-6 text-center text-xs text-zinc-500">No highlights</div>
              ) : (
                <div className="space-y-1">
                  {items
                    .slice()
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((h) => (
                      <button
                        key={h.id}
                        onClick={() => onPick(h)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-xs text-zinc-800 hover:bg-zinc-50"
                      >
                        <div className="line-clamp-2">{h.excerpt || "(Empty)"}</div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BlockRenderer({
  block,
  highlights,
  activeHighlightId,
  onBlockMouseUp,
  registerHighlightEl,
}: {
  block: Block;
  highlights: Highlight[];
  activeHighlightId: string | null;
  onBlockMouseUp: (args: { block: Block; el: HTMLElement }) => void;
  registerHighlightEl: (highlightId: string, el: HTMLElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const Tag = block.type === "h1" ? "h2" : block.type === "h2" ? "h3" : block.type === "h3" ? "h4" : "p";

  const text = block.text;
  const sorted = [...highlights].sort((a, b) => a.start - b.start);

  const pieces: Array<{ kind: "text"; value: string } | { kind: "mark"; value: string; id: string }> = [];
  let cursor = 0;
  for (const h of sorted) {
    const s = clamp(h.start, 0, text.length);
    const e = clamp(h.end, 0, text.length);
    if (e <= cursor) continue;
    if (s > cursor) pieces.push({ kind: "text", value: text.slice(cursor, s) });
    pieces.push({ kind: "mark", value: text.slice(s, e), id: h.id });
    cursor = e;
  }
  if (cursor < text.length) pieces.push({ kind: "text", value: text.slice(cursor) });

  const base =
    block.type === "h1"
      ? "text-base font-semibold tracking-tight text-zinc-950"
      : block.type === "h2"
      ? "text-sm font-semibold text-zinc-950"
      : block.type === "h3"
      ? "text-sm font-medium text-zinc-900"
      : "text-sm leading-6 text-zinc-700";

  return (
    <div
      ref={ref}
      className="group"
      onMouseUp={() => {
        if (ref.current) onBlockMouseUp({ block, el: ref.current });
      }}
    >
      <Tag className={base + " whitespace-pre-wrap"}>
        {pieces.map((p, idx) => {
          if (p.kind === "text") return <React.Fragment key={idx}>{p.value}</React.Fragment>;
          return (
            <mark
              key={p.id}
              ref={(el) => registerHighlightEl(p.id, el)}
              className={
                "rounded px-0.5 " +
                (activeHighlightId === p.id ? "bg-yellow-200/90 ring-2 ring-yellow-300" : "bg-yellow-200/60")
              }
            >
              <motion.span
                animate={activeHighlightId === p.id ? { opacity: [1, 0.65, 1] } : { opacity: 1 }}
                transition={activeHighlightId === p.id ? { duration: 0.9, times: [0, 0.5, 1] } : { duration: 0.2 }}
              >
                {p.value}
              </motion.span>
            </mark>
          );
        })}
      </Tag>
    </div>
  );
}

// ----------------------------
// Main
// ----------------------------

export default function TimelineNavigatorDemo() {
  const [messages] = useState<Message[]>(demoMessages);
  const { blocksByMessage, nav } = useMemo(() => buildNav(messages), [messages]);

  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const highlightsByMessage = useMemo(() => groupBy(highlights, (h) => h.messageId), [highlights]);

  // DOM refs for scrolling
  const messageEls = useRef<Record<string, HTMLElement | null>>({});
  const h2Els = useRef<Record<string, HTMLElement | null>>({});
  const highlightEls = useRef<Record<string, HTMLElement | null>>({});

  const registerMessageEl = (messageId: string, el: HTMLElement | null) => {
    messageEls.current[messageId] = el;
  };
  const registerH2El = (blockId: string, el: HTMLElement | null) => {
    h2Els.current[blockId] = el;
  };
  const registerHighlightEl = (highlightId: string, el: HTMLElement | null) => {
    highlightEls.current[highlightId] = el;
  };

  // Active states
  const [activeMessageId, setActiveMessageId] = useState<string | null>(messages[0]?.id ?? null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  // Hover state for expanding node details
  const [hoverMessageId, setHoverMessageId] = useState<string | null>(null);

  // Popover state
  const [popover, setPopover] = useState<PopoverState>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);

  const computePopoverAnchor = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const PAD = 12;
    const W = 256; // w-64
    const x = Math.min(window.innerWidth - W - PAD, rect.right + 10);
    const y = Math.min(window.innerHeight - 220, Math.max(PAD, rect.top - 8));
    return { x, y };
  };

  const openPopoverAt = (next: Exclude<PopoverState, null>, anchorEl: HTMLElement) => {
    const same =
      !!popover &&
      popover.kind === next.kind &&
      popover.messageId === next.messageId &&
      (popover.kind === "message" ? true : popover.h2Id === next.h2Id);

    if (same) {
      setPopover(null);
      setPopoverAnchor(null);
      return;
    }

    setPopover(next);
    setPopoverAnchor(computePopoverAnchor(anchorEl));
  };

  // Selection toolbar
  const [pending, setPending] = useState<
    | null
    | {
        messageId: string;
        blockId: string;
        start: number;
        end: number;
        x: number;
        y: number;
      }
  >(null);

  // Self-tests (dev only)
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") runDevSelfTests();
  }, []);

  // Scroll-spy: active message
  useEffect(() => {
    const entries = Object.entries(messageEls.current).filter(([, el]) => el);
    if (entries.length === 0) return;

    const obs = new IntersectionObserver(
      (ioEntries) => {
        const visible = ioEntries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0));
        if (!visible[0]?.target) return;
        const id = (visible[0].target as HTMLElement).dataset.messageId;
        if (id) setActiveMessageId(id);
      },
      { root: null, threshold: [0.2], rootMargin: "-20% 0px -70% 0px" }
    );

    for (const [, el] of entries) obs.observe(el!);
    return () => obs.disconnect();
  }, [messages]);

  // Dismiss interactions
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPending(null);
        setPopover(null);
        setPopoverAnchor(null);
        setActiveHighlightId(null);
        window.getSelection()?.removeAllRanges();
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-timeline-root]")) return;
      if (target.closest("[data-highlight-popover]")) return;
      if (target.closest("[data-selection-toolbar]")) return;
      setPopover(null);
      setPopoverAnchor(null);
      setPending(null);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  const addHighlight = (h: Omit<Highlight, "id" | "createdAt">) => {
    setHighlights((prev) => [{ ...h, id: uid("hl"), createdAt: Date.now() }, ...prev]);
  };

  const onBlockMouseUp = ({ block, el }: { block: Block; el: HTMLElement }) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;

    const offsets = getSelectionOffsetsWithin(el, range);
    if (!offsets) return;

    const rect = range.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top - 10;

    const messageEl = el.closest("[data-message-id]") as HTMLElement | null;
    const messageId = messageEl?.dataset.messageId;
    if (!messageId) return;

    setPending({
      messageId,
      blockId: block.id,
      start: offsets.start,
      end: offsets.end,
      x,
      y,
    });
  };

  const commitHighlight = () => {
    if (!pending) return;
    const blocks = blocksByMessage[pending.messageId] ?? [];
    const block = blocks.find((b) => b.id === pending.blockId);
    if (!block) {
      setPending(null);
      return;
    }

    addHighlight({
      messageId: pending.messageId,
      blockId: pending.blockId,
      start: pending.start,
      end: pending.end,
      excerpt: excerptFor(block.text, pending.start, pending.end),
    });

    setPending(null);
    window.getSelection()?.removeAllRanges();
  };

  const scrollToMessage = (messageId: string) => {
    const el = messageEls.current[messageId];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToH2 = (blockId: string) => {
    const el = h2Els.current[blockId];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToHighlight = (highlightId: string) => {
    const el = highlightEls.current[highlightId];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setActiveHighlightId(highlightId);
    window.setTimeout(() => setActiveHighlightId((cur) => (cur === highlightId ? null : cur)), 1100);
  };

  const highlightsForMessage = (messageId: string) => highlightsByMessage[messageId] ?? [];

  const highlightsForH2 = (h2: H2Node) => {
    const msgBlocks = blocksByMessage[h2.messageId] ?? [];
    const msgHighlights = highlightsByMessage[h2.messageId] ?? [];
    return msgHighlights.filter((hl) => {
      const bIndex = msgBlocks.findIndex((b) => b.id === hl.blockId);
      return bIndex >= h2.blockIndex && bIndex <= h2.scopeEndBlockIndex;
    });
  };

  const messageHighlightCount = (messageId: string) => highlightsForMessage(messageId).length;
  const h2HighlightCount = (h2: H2Node) => highlightsForH2(h2).length;

  const popoverItems = useMemo(() => {
    if (!popover) return { title: "", items: [] as Highlight[] };
    if (popover.kind === "message") {
      const t = nav.find((n) => n.message.id === popover.messageId)?.title ?? "Message";
      return { title: `Highlights · ${t}`, items: highlightsForMessage(popover.messageId) };
    }
    const target = nav
      .find((n) => n.message.id === popover.messageId)
      ?.h2.find((x) => x.id === popover.h2Id);
    if (!target) return { title: "Highlights", items: [] as Highlight[] };
    return { title: `Highlights · ${target.title}`, items: highlightsForH2(target) };
  }, [popover, highlightsByMessage, nav]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <header className="mb-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-zinc-600">TOC 方案探索</div>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">Chat TOC · 时间线高亮</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                  左侧时间线轨道：每条消息一个节点，节点下挂 H2 二级索引与高亮标记；点击可跳转与查看高亮。
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700">
                  Select -&gt; Highlight
                </span>
                <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700">
                  Hover node to expand
                </span>
                <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700">
                  Esc to dismiss
                </span>
              </div>
            </div>
          </header>

          <div className="relative">
            {/* Timeline rail (NOT a panel) */}
            <div className="pointer-events-none fixed left-4 top-28 z-40 hidden lg:block">
              <div data-timeline-root className="pointer-events-auto relative" onMouseLeave={() => setHoverMessageId(null)}>
                <div className="relative pl-3">
                  <div className="space-y-3">
                    {nav.map((n, idx) => {
                      const m = n.message;
                      const isActive = activeMessageId === m.id;
                      const isOpen = hoverMessageId === m.id || isActive;
                      const totalHl = messageHighlightCount(m.id);

                      return (
                        <div key={m.id} className="relative" onMouseEnter={() => setHoverMessageId(m.id)}>
                          <div className="flex items-stretch ">
                            {/* dot + connectors */}
                            <div className="relative w-6 flex-none">
                              {idx !== 0 ? (
                                <div className="pointer-events-none absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-zinc-200" />
                              ) : null}
                              {idx !== nav.length - 1 ? (
                                <div className="pointer-events-none absolute left-1/2 top-3 bottom-0 w-px -translate-x-1/2 bg-zinc-200" />
                              ) : null}

                              <div className="relative h-6 w-6">
                                <button
                                  onClick={() => {
                                    setPopover(null);
                                    setPopoverAnchor(null);
                                    scrollToMessage(m.id);
                                  }}
                                  className="absolute inset-0 flex items-center justify-center rounded-full"
                                  title="Jump to message"
                                >
                                  <span
                                    className={
                                      "inline-flex h-2.5 w-2.5 rounded-full border " +
                                      (isActive
                                        ? "border-zinc-900 bg-zinc-900"
                                        : "border-zinc-300 bg-white hover:border-zinc-400")
                                    }
                                  />
                                </button>

                                {totalHl > 0 ? (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      openPopoverAt({ kind: "message", messageId: m.id }, e.currentTarget as HTMLElement);
                                    }}
                                    className="absolute -right-1 -top-1 inline-flex items-center rounded-full border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] tabular-nums text-zinc-700 shadow-sm hover:bg-zinc-50"
                                    title="Show highlights in this message"
                                  >
                                    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" />
                                    {totalHl}
                                  </button>
                                ) : null}
                              </div>
                            </div>

                            {/* label area */}
                            <div className="min-w-0">
                              <div className="flex h-6 items-center gap-2">
                                <button
                                  onClick={() => {
                                    setPopover(null);
                                    setPopoverAnchor(null);
                                    scrollToMessage(m.id);
                                  }}
                                  className={
                                    "min-w-0 truncate rounded-lg px-2 text-left text-xs leading-6 " +
                                    (isActive ? "font-medium text-zinc-900" : "text-zinc-700 hover:bg-zinc-100")
                                  }
                                  title={n.title}
                                >
                                  {n.title}
                                </button>
                              </div>

                              <AnimatePresence initial={false}>
                                {isOpen ? (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-2 space-y-1">
                                      {n.h2.length === 0 ? (
                                        <div className="px-2 py-1 text-[11px] text-zinc-500">No sections</div>
                                      ) : (
                                        n.h2.map((h2) => {
                                          const cnt = h2HighlightCount(h2);
                                          return (
                                            <div key={h2.id} className="flex items-center gap-2">
                                              <button
                                                onClick={() => {
                                                  setPopover(null);
                                                  setPopoverAnchor(null);
                                                  scrollToH2(h2.blockId);
                                                }}
                                                className="min-w-0 flex-1 truncate rounded-lg px-2 py-1 text-left text-[11px] text-zinc-700 hover:bg-zinc-100"
                                                title={h2.title}
                                              >
                                                {h2.title}
                                              </button>

                                              {cnt > 0 ? (
                                                <button
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    openPopoverAt(
                                                      { kind: "h2", messageId: m.id, h2Id: h2.id },
                                                      e.currentTarget as HTMLElement
                                                    );
                                                  }}
                                                  className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-700 hover:bg-zinc-50"
                                                  title={`${cnt} highlights in this section`}
                                                >
                                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" />
                                                  <span className="tabular-nums">{cnt}</span>
                                                </button>
                                              ) : null}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <FloatingPopover
                    open={!!popover}
                    anchor={popoverAnchor}
                    title={popoverItems.title}
                    items={popoverItems.items}
                    onPick={(h) => {
                      setPopover(null);
                      setPopoverAnchor(null);
                      scrollToHighlight(h.id);
                    }}
                    onClose={() => {
                      setPopover(null);
                      setPopoverAnchor(null);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Content column */}
            <div className="mx-auto max-w-3xl">
              <div className="space-y-6">
                {messages.map((m) => {
                  const blocks = blocksByMessage[m.id] ?? [];
                  const msgHighlights = highlightsByMessage[m.id] ?? [];

                  return (
                    <div
                      key={m.id}
                      data-message-id={m.id}
                      ref={(el) => registerMessageEl(m.id, el as HTMLElement | null)}
                      className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-xs text-zinc-500">{m.id}</div>
                        {msgHighlights.length > 0 ? (
                          <div className="text-xs text-zinc-500">
                            <span className="inline-flex items-center gap-1">
                              <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
                              <span className="tabular-nums">{msgHighlights.length}</span>
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-3">
                        {blocks.map((b) => {
                          const blockHighlights = msgHighlights.filter((h) => h.blockId === b.id);
                          const isH2 = b.type === "h2";

                          return (
                            <div
                              key={b.id}
                              data-block-id={b.id}
                              ref={(el) => {
                                if (isH2) registerH2El(b.id, el as HTMLElement | null);
                              }}
                              className={isH2 ? "scroll-mt-24" : ""}
                            >
                              <BlockRenderer
                                block={b}
                                highlights={blockHighlights}
                                activeHighlightId={activeHighlightId}
                                onBlockMouseUp={onBlockMouseUp}
                                registerHighlightEl={registerHighlightEl}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
                <div className="font-medium text-zinc-900">How to test</div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>左侧 timeline: 每条消息一个圆点节点 (非面板)</li>
                  <li>hover 节点: 展开 H2 列表 (active 节点也展开)</li>
                  <li>没有 H2 时, 展示 No sections 占位</li>
                  <li>划选内容文本 -&gt; 点击 Highlight 创建高亮</li>
                  <li>时间线 badge 显示高亮数量; 点 badge 打开 popover</li>
                  <li>popover 点某条高亮 -&gt; 跳转并 pulse</li>
                </ul>
              </div>
            </div>

            <SelectionToolbar
              open={!!pending}
              x={pending?.x ?? 0}
              y={pending?.y ?? 0}
              onHighlight={commitHighlight}
              onDismiss={() => {
                setPending(null);
                window.getSelection()?.removeAllRanges();
              }}
            />
          </div>
        </div>

        <footer className="mt-10 border-t border-zinc-200/60 py-10">
          <div className="mx-auto max-w-6xl px-4 text-xs text-zinc-500">
            Timeline Navigator · Message nodes + H2 + Highlights · Tailwind + Framer Motion
          </div>
        </footer>
      </div>
    </>
  );
}
