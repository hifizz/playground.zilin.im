/**
 * ============================================================================
 * Highlight Recovery · 文本锚点核心（DOM-free / 纯字符串层）
 * ============================================================================
 * 「在网页里找回一段被高亮的文本」的问题，剥掉 DOM 之后就是一个纯字符串问题：
 *
 *   给定一段容器文本 text，以及当初记录下来的锚点 anchor（引用文本 + 上下文 +
 *   字符偏移），在**文本可能已经漂移**（重渲染、空白重排、被编辑）的情况下，
 *   重新定位出 [start, end) 这段偏移。
 *
 * 本文件只处理字符串 ↔ 偏移，不碰 DOM，方便单测与移植。DOM 胶水在 ./anchor.ts。
 *
 * 定位分三层，逐层降级，越靠后越「模糊」：
 *   1. position —— 直接用记录的偏移，校验该处文本仍等价于引用文本（最快，页面没变时命中）。
 *   2. exact    —— 全文精确搜索引用文本；多处命中时用 prefix/suffix 上下文 + 偏移就近消歧。
 *   3. fuzzy    —— 引用文本被改动到精确搜不到时，用「近似子串匹配」找最相似的一段，
 *                  给出相似度分数，低于阈值则判定丢失。
 * ============================================================================
 */

/** 记录锚点时前后各截取多少字符作为上下文。 */
export const CONTEXT_WINDOW = 32

/** 文本引用选择器（W3C Web Annotation TextQuoteSelector 简化版）。 */
export interface TextQuoteSelector {
  /** 被选中的确切文本。 */
  exact: string
  /** 选区左侧的上下文（用于多处命中时消歧）。 */
  prefix: string
  /** 选区右侧的上下文。 */
  suffix: string
}

/** 字符偏移选择器（快路径，页面结构没变时一击命中）。 */
export interface TextPositionSelector {
  start: number
  end: number
}

/** 一个可持久化的锚点：quote 是稳态线索，position 是加速线索。 */
export interface TextAnchor {
  quote: TextQuoteSelector
  position?: TextPositionSelector
}

export type LocateStrategy = 'position' | 'exact' | 'fuzzy'

export interface LocateResult {
  start: number
  end: number
  /** 命中所用的策略，供 UI 标注与调试。 */
  strategy: LocateStrategy
  /** 命中置信度 0–1；position / exact 恒为 1，fuzzy 为相似度。 */
  score: number
}

export interface LocateOptions {
  /** fuzzy 命中的最低相似度，低于此值视为丢失。默认 0.7。 */
  fuzzyThreshold?: number
}

const DEFAULT_FUZZY_THRESHOLD = 0.7

/** 折叠所有空白为单空格并去除首尾（用于等价性比较）。 */
export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/** 从一段文本快照 + 选区偏移构建 quote 选择器。 */
export function buildQuoteSelector(
  snapshot: string,
  start: number,
  end: number,
): TextQuoteSelector {
  return {
    exact: snapshot.slice(start, end),
    prefix: snapshot.slice(Math.max(0, start - CONTEXT_WINDOW), start),
    suffix: snapshot.slice(end, end + CONTEXT_WINDOW),
  }
}

/* -------------------------------------------------------------------------- */
/* 空白归一化 + 索引映射                                                        */
/* -------------------------------------------------------------------------- */

interface NormalizedText {
  /** 归一化后的文本（连续空白折叠为单个空格，保留首尾）。 */
  norm: string
  /** norm[k] 对应原文的起始下标。 */
  starts: number[]
  /** norm[k] 对应原文的结束下标（不含）。折叠空格会覆盖整段空白。 */
  ends: number[]
}

/**
 * 归一化空白并保留「归一化下标 → 原文下标」的双向映射。
 * fuzzy 匹配在归一化文本上做（对空白重排免疫），命中后再映射回原文偏移。
 */
function normalizeWithMap(raw: string): NormalizedText {
  const starts: number[] = []
  const ends: number[] = []
  let norm = ''
  let inWhitespace = false

  for (let i = 0; i < raw.length; i++) {
    const isWs = /\s/.test(raw[i])
    if (isWs) {
      if (!inWhitespace) {
        norm += ' '
        starts.push(i)
        ends.push(i + 1)
        inWhitespace = true
      } else {
        // 延长当前折叠空格覆盖的原文范围
        ends[ends.length - 1] = i + 1
      }
    } else {
      norm += raw[i]
      starts.push(i)
      ends.push(i + 1)
      inWhitespace = false
    }
  }

  return { norm, starts, ends }
}

/* -------------------------------------------------------------------------- */
/* 近似子串匹配（fuzzy 核心）                                                    */
/* -------------------------------------------------------------------------- */

export interface FuzzyMatch {
  /** 归一化坐标下的匹配区间 [start, end)。 */
  start: number
  end: number
  /** 该匹配相对 pattern 的编辑距离。 */
  distance: number
}

/**
 * 在 text 中找出与 pattern 最相似的一段子串（近似子串匹配）。
 *
 * 用带「首尾自由 gap」的编辑距离 DP 实现：文本开头/结尾的字符可以任意跳过而不计代价，
 * 于是问题变成「pattern 对齐到 text 某个子串的最小编辑距离」。同时容忍替换 / 插入 /
 * 删除，所以对错字、增删词都稳。复杂度 O(n·m)，只在 exact 失败时兜底跑一次。
 *
 * @param hint 归一化坐标下的期望位置，用于在多个等距候选间就近消歧（可选）。
 */
export function fuzzySubstring(
  text: string,
  pattern: string,
  hint?: number,
): FuzzyMatch | null {
  const m = pattern.length
  const n = text.length
  if (m === 0 || n === 0) return null

  // 滚动两行 DP：dist[j] = pattern[0..i) 对齐到「结束于 text 第 j 列」子串的最小编辑距离；
  // from[j] = 该对齐在 text 中的起始列（用于回推匹配区间）。
  let prevDist = new Array<number>(n + 1)
  let prevFrom = new Array<number>(n + 1)
  let currDist = new Array<number>(n + 1)
  let currFrom = new Array<number>(n + 1)

  // i = 0：空 pattern，任意起点免费，结束列即起始列。
  for (let j = 0; j <= n; j++) {
    prevDist[j] = 0
    prevFrom[j] = j
  }

  for (let i = 1; i <= m; i++) {
    currDist[0] = i // pattern 前 i 个字符对齐到空文本 = i 次删除
    currFrom[0] = 0
    const patChar = pattern[i - 1]

    for (let j = 1; j <= n; j++) {
      const subCost = prevDist[j - 1] + (patChar === text[j - 1] ? 0 : 1) // 对角：替换/相等
      const skipTextCost = currDist[j - 1] + 1 // 左：跳过一个 text 字符（text 里多出的字符）
      const dropPatCost = prevDist[j] + 1 // 上：pattern 字符没匹配上（删除）

      let best = subCost
      let from = prevFrom[j - 1]
      if (skipTextCost < best) {
        best = skipTextCost
        from = currFrom[j - 1]
      }
      if (dropPatCost < best) {
        best = dropPatCost
        from = prevFrom[j]
      }

      currDist[j] = best
      currFrom[j] = from
    }

    // 滚动
    ;[prevDist, currDist] = [currDist, prevDist]
    ;[prevFrom, currFrom] = [currFrom, prevFrom]
  }

  // prevDist/prevFrom 现在是第 m 行；在所有结束列里挑最优。
  let bestJ = -1
  let bestDist = Infinity
  for (let j = 1; j <= n; j++) {
    const d = prevDist[j]
    if (d > bestDist) continue
    if (d < bestDist) {
      bestDist = d
      bestJ = j
      continue
    }
    // 距离相等：用 hint 就近消歧，否则取更靠前的
    if (hint != null && bestJ !== -1) {
      const start = prevFrom[j]
      const bestStart = prevFrom[bestJ]
      if (Math.abs(start - hint) < Math.abs(bestStart - hint)) bestJ = j
    }
  }

  if (bestJ === -1) return null
  const start = prevFrom[bestJ]
  const end = bestJ
  if (end <= start) return null
  return { start, end, distance: bestDist }
}

/* -------------------------------------------------------------------------- */
/* 精确定位（含 prefix/suffix + 偏移消歧）                                       */
/* -------------------------------------------------------------------------- */

function findExactOffsets(
  text: string,
  quote: TextQuoteSelector,
  hint?: number,
): { start: number; end: number } | null {
  if (!quote.exact) return null

  const matches: number[] = []
  let index = text.indexOf(quote.exact)
  while (index !== -1) {
    matches.push(index)
    index = text.indexOf(quote.exact, index + 1)
  }
  if (matches.length === 0) return null
  if (matches.length === 1) {
    return { start: matches[0], end: matches[0] + quote.exact.length }
  }

  // 多处命中：按「上下文吻合度 + 偏移就近」打分选最优
  let bestStart = matches[0]
  let bestScore = -Infinity
  for (const start of matches) {
    const prefixCandidate = text.slice(Math.max(0, start - quote.prefix.length), start)
    const suffixCandidate = text.slice(
      start + quote.exact.length,
      start + quote.exact.length + quote.suffix.length,
    )
    let score = 0
    if (quote.prefix && prefixCandidate.endsWith(quote.prefix)) score += 2
    if (quote.suffix && suffixCandidate.startsWith(quote.suffix)) score += 2
    if (hint != null) score -= Math.abs(start - hint) / Math.max(1, text.length)
    if (score > bestScore) {
      bestScore = score
      bestStart = start
    }
  }
  return { start: bestStart, end: bestStart + quote.exact.length }
}

/* -------------------------------------------------------------------------- */
/* 分层定位入口                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 在 text 中定位 anchor，返回偏移区间与所用策略；找不到返回 null。
 * 三层降级：position → exact → fuzzy。
 */
export function locateOffsets(
  text: string,
  anchor: TextAnchor,
  options: LocateOptions = {},
): LocateResult | null {
  const { quote, position } = anchor
  if (!quote?.exact) return null
  const threshold = options.fuzzyThreshold ?? DEFAULT_FUZZY_THRESHOLD
  const hint = position?.start

  // 1) position：偏移仍然指向等价文本 → 直接采用
  if (position) {
    const { start, end } = position
    if (start >= 0 && end > start && end <= text.length) {
      const slice = text.slice(start, end)
      if (normalizeWhitespace(slice) === normalizeWhitespace(quote.exact)) {
        return { start, end, strategy: 'position', score: 1 }
      }
    }
  }

  // 2) exact：全文精确搜索 + 上下文/偏移消歧
  const exact = findExactOffsets(text, quote, hint)
  if (exact) {
    return { start: exact.start, end: exact.end, strategy: 'exact', score: 1 }
  }

  // 3) fuzzy：近似子串匹配（在归一化文本上做，再映射回原文偏移）
  const { norm, starts, ends } = normalizeWithMap(text)
  const normPattern = normalizeWhitespace(quote.exact)
  if (!normPattern) return null

  // 把偏移 hint 映射到归一化坐标：找到 starts 中 <= hint 的最大下标
  let normHint: number | undefined
  if (hint != null) {
    let lo = 0
    let hi = starts.length - 1
    normHint = 0
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (starts[mid] <= hint) {
        normHint = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
  }

  const match = fuzzySubstring(norm, normPattern, normHint)
  if (!match) return null

  const score = 1 - match.distance / normPattern.length
  if (score < threshold) return null

  const rawStart = starts[match.start]
  const rawEnd = ends[match.end - 1]
  if (rawStart == null || rawEnd == null || rawEnd <= rawStart) return null

  return { start: rawStart, end: rawEnd, strategy: 'fuzzy', score }
}
