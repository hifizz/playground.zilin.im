/**
 * ============================================================================
 * Highlight Recovery · DOM 胶水层
 * ============================================================================
 * 把纯字符串核心（./anchor-core）接到真实 DOM：
 *   - Range ↔ 字符偏移 互转（以容器 textContent 为坐标系）；
 *   - describeRange：从一次选区生成可持久化锚点；
 *   - locateAnchor：在容器里重新定位锚点并给出 Range；
 *   - paintRange / clearHighlights：用 <span> 包裹区间实现高亮，可无损还原。
 *
 * 坐标系约定：容器文本 = 容器内所有文本节点 .data 顺序拼接（等于 textContent，
 * 也等于 Range.selectNodeContents(root).toString()）。offset ↔ Range 两个方向都
 * 走这套坐标，保证一致。
 * ============================================================================
 */

import {
  buildQuoteSelector,
  locateOffsets,
  type LocateOptions,
  type LocateResult,
  type TextAnchor,
} from './anchor-core'

export type { TextAnchor, LocateResult, LocateStrategy } from './anchor-core'

export interface LocatedAnchor extends LocateResult {
  range: Range
}

/** 容器的文本坐标系：所有文本节点顺序拼接。 */
export function getRootText(root: Element): string {
  const range = root.ownerDocument.createRange()
  range.selectNodeContents(root)
  return range.toString()
}

/** 求 (node, offset) 相对容器起点的字符偏移。 */
function offsetFromPoint(root: Element, node: Node, offset: number): number {
  const range = root.ownerDocument.createRange()
  range.selectNodeContents(root)
  range.setEnd(node, offset)
  return range.toString().length
}

/** 把字符区间 [start, end) 还原成容器内的 Range。 */
export function rangeFromOffsets(root: Element, start: number, end: number): Range | null {
  if (start < 0 || end <= start) return null

  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let consumed = 0
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0

  let current = walker.nextNode() as Text | null
  while (current) {
    const len = current.data.length
    if (!startNode && consumed + len >= start) {
      startNode = current
      startOffset = start - consumed
    }
    if (startNode && consumed + len >= end) {
      endNode = current
      endOffset = end - consumed
      break
    }
    consumed += len
    current = walker.nextNode() as Text | null
  }

  if (!startNode || !endNode) return null
  const range = root.ownerDocument.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)
  return range
}

/** 从一次真实选区生成锚点（quote 上下文 + position 偏移）。 */
export function describeRange(root: Element, range: Range): TextAnchor | null {
  const raw = range.toString()
  const trimmed = raw.trim()
  if (trimmed.length < 1) return null

  const snapshot = getRootText(root)
  const start = offsetFromPoint(root, range.startContainer, range.startOffset)
  const end = offsetFromPoint(root, range.endContainer, range.endOffset)
  if (end <= start) return null

  return {
    quote: buildQuoteSelector(snapshot, start, end),
    position: { start, end },
  }
}

/** 在容器里重新定位锚点，返回带 Range 的结果；找不到返回 null。 */
export function locateAnchor(
  root: Element,
  anchor: TextAnchor,
  options?: LocateOptions,
): LocatedAnchor | null {
  const text = getRootText(root)
  const result = locateOffsets(text, anchor, options)
  if (!result) return null
  const range = rangeFromOffsets(root, result.start, result.end)
  if (!range) return null
  return { ...result, range }
}

/* -------------------------------------------------------------------------- */
/* 高亮绘制（<span> 包裹，可无损移除）                                            */
/* -------------------------------------------------------------------------- */

const MARK_ATTR = 'data-hlr-mark'

function collectTextNodes(range: Range): Text[] {
  const root =
    range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? (range.commonAncestorContainer as Element)
      : range.commonAncestorContainer.parentElement
  if (!root) return []

  const nodes: Text[] = []
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  })
  let current = walker.nextNode() as Text | null
  while (current) {
    nodes.push(current)
    current = walker.nextNode() as Text | null
  }
  return nodes
}

/**
 * 用 <span data-hlr-mark=id> 包裹 range 覆盖的文本，实现高亮。
 * 逐个文本节点切分包裹，跨行 / 跨内联元素都能贴合。返回是否绘制成功。
 */
export function paintRange(range: Range, id: string, color: string): boolean {
  if (range.collapsed) return false
  const nodes = collectTextNodes(range)
  if (nodes.length === 0) return false

  let painted = false
  nodes.forEach((node) => {
    if (!node.data) return
    if (node.parentElement?.closest(`[${MARK_ATTR}]`)) return

    let start = 0
    let end = node.data.length
    if (node === range.startContainer) start = range.startOffset
    if (node === range.endContainer) end = range.endOffset
    if (start >= end) return

    let target = node
    if (start > 0 && start < target.length) {
      target = target.splitText(start)
      end -= start
    }
    if (end < target.length) target.splitText(end)

    const span = target.ownerDocument.createElement('span')
    span.setAttribute(MARK_ATTR, id)
    span.style.background = color
    span.style.borderRadius = '2px'
    span.style.color = 'inherit'
    span.style.transition = 'background 200ms ease'

    const parent = target.parentNode
    if (!parent) return
    parent.insertBefore(span, target)
    span.appendChild(target)
    painted = true
  })

  return painted
}

function unwrap(span: Element) {
  const parent = span.parentNode
  if (!parent) return
  while (span.firstChild) parent.insertBefore(span.firstChild, span)
  parent.removeChild(span)
  parent.normalize?.()
}

/** 移除指定 id（或全部）高亮，还原 DOM。 */
export function clearHighlights(root: Element, id?: string): void {
  const selector = id ? `span[${MARK_ATTR}="${cssEscape(id)}"]` : `span[${MARK_ATTR}]`
  root.querySelectorAll(selector).forEach(unwrap)
}

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value)
  return value.replace(/"/g, '\\"')
}
