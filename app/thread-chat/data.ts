/**
 * Thread Chat —— 写死的演示内容（种子数据 + 各话题的 canned 回复 / artifact 种子）。
 * 类型定义已挪到 core/types.ts；本文件只负责「内容」，不含任何逻辑。
 */

import type { ArtifactKind, ArtifactSeed, Message, ThreadTreeState } from "./core/types";

/* ---------------- 主线内容 ---------------- */

const MAIN_USER = "我想搞懂 AI Agent 的「记忆」到底是怎么实现的。";

const MAIN_ASSISTANT = `简单说，Agent 的记忆不是一整块，而是按时间尺度分成三层。最短的是工作记忆，只存在于当前这一次模型推理里；往上是短期记忆，对应一次完整的会话；最外层是长期记忆，能跨会话、跨天保留下来。

要让长期记忆真正可用，工程上最常见的做法是向量检索：把每段历史对话转成向量存进数据库，需要时按语义相似度捞回最相关的几条。它简单好用，但也有天生的短板——它找回的是「向量空间里近的」，未必是「逻辑上相关的」。

于是有人转向图记忆，把记忆组织成实体和关系构成的网络，查询时沿着关系链走，而不是比相似度。另一条正在成为事实标准的路线叫 Memory-as-Tool，把存记忆和查记忆做成工具，让模型自己决定什么时候记、记什么。

还有一个容易被忽略的坑叫上下文腐烂：上下文越长，模型的有效注意力反而被摊薄，塞在中间的信息容易被忽略。所以记忆系统的目标从来不是记得越多越好，而是在每个时刻把最相关的那一小撮内容拉进来。`;

/* ---------------- 分支话题的写死回答 ---------------- */

export const CANNED: Record<string, string> = {
  向量检索: `向量检索的核心是三步：先用 Embedding 模型把文本变成一串数字（向量），再用余弦相似度衡量两段文本有多接近，最后按相似度排序取前几名。

它最大的优点是能捕捉语义——就算用词不同，只要意思接近就能被找回。难点在切分策略：一段文本按什么粒度切成块，直接决定召回质量。右侧抽屉里放了一份最小实现，点消息下方的卡片可以随时再打开。`,
  图记忆: `图记忆把每条信息拆成实体和关系，存进知识图谱。查询时不是比相似度，而是沿着关系链走——「找张三相关的所有项目」这种问题，图记忆天然擅长。

进阶版会给每条关系加上时序，比如 Zep 的做法：每条事实带生效时间和失效时间。右侧抽屉里有两段对应的查询示例。`,
  "Memory-as-Tool": `这条路的本质是：不写死规则，而是给模型存记忆、查记忆、改记忆三个工具，让它自己判断什么时候用。

难点在写入时机的引导：模型默认不会主动记，你得在系统提示里告诉它用户表达稳定偏好时记、纠正你时记。右侧抽屉里放了 memory_write 工具的 Schema 定义。`,
  上下文腐烂: `上下文腐烂说的是：窗口写着能装 100K，但模型的有效注意力远没那么长。塞在最前和最后的容易被记住，塞在中间的容易被忽略——这就是 lost in the middle。

所以排布上下文的顺序很重要：最关键的放开头或结尾。`,
  "Embedding 模型": `Embedding 模型负责把文本翻译成向量。同一句话，不同模型给出的向量不一样，召回效果也不同。中英文混合场景尤其要测过再定。`,
  余弦相似度: `余弦相似度衡量两个向量的夹角——夹角越小越相似。它只看方向不看长度，长短不同的文本也能公平比较。`,
  工作记忆: `工作记忆就是当前这一次推理能看到的全部内容：系统提示、最近几条消息、中间状态。寿命等于一次推理。`,
  短期记忆: `短期记忆通常等同于本次会话，边界是会话的开始和结束。`,
  长期记忆: `长期记忆是跨会话、跨天保留的信息。实现上大多落到外部存储加检索。`,
  有效注意力: `有效注意力指模型真正用得上的那部分上下文，往往远小于窗口的纸面长度。`,
};

export const REPLIES = [
  "这是一条模拟回复，用来演示分支内的多轮对话。真实产品里会接入模型，并继承此列上方的全部上下文。",
  "演示回复：此列顶部的面包屑记录了从主线到这里的完整路径，点任意一级就地回退；点标题旁的 ⇄ 可以把这一列切换成任意会话。",
  "演示回复：按 ⌘K 打开会话树，可以搜索并跳到任何一个分支；列满时新分支会替换一列，提示条里能一键撤销。",
];

/* ---------------- Artifact 种子（按分支锚点话题触发） ---------------- */

export const ARTIFACT_SEEDS: Record<string, ArtifactSeed> = {
  向量检索: {
    title: "余弦相似度检索 · 最小实现",
    kind: "code",
    lang: "python",
    content: `# 余弦相似度检索（最小实现）
import numpy as np

def embed(texts: list[str]) -> np.ndarray:
    """调用 Embedding 模型，把文本变成向量矩阵 (n, d)"""
    ...

def search(query: str, corpus: np.ndarray, top_k: int = 5):
    q = embed([query])[0]
    sims = corpus @ q / (
        np.linalg.norm(corpus, axis=1) * np.linalg.norm(q) + 1e-9
    )
    return np.argsort(-sims)[:top_k]  # 相似度最高的 top_k 条

# 切分策略决定召回质量：
#   块太大 → 噪声多；块太小 → 语义被截断`,
  },
  图记忆: {
    title: "记忆图谱查询 · Cypher 示例",
    kind: "code",
    lang: "cypher",
    content: `// 沿关系链查询：找「张三」两跳内的所有项目
MATCH (p:Person {name: '张三'})-[r*1..2]-(proj:Project)
RETURN proj.name, [rel IN r | type(rel)] AS path

// Zep 式时序事实：每条关系带生效 / 失效时间
MATCH (a)-[f:FACT]->(b)
WHERE f.valid_at <= $now
  AND ($now < f.invalid_at OR f.invalid_at IS NULL)
RETURN a, f, b`,
  },
  "Memory-as-Tool": {
    title: "memory_write · 工具 Schema",
    kind: "code",
    lang: "json",
    content: `{
  "name": "memory_write",
  "description": "当用户表达稳定偏好、纠正你、或给出长期有效的事实时调用",
  "input_schema": {
    "type": "object",
    "properties": {
      "content":  { "type": "string", "description": "要记住的一句话事实" },
      "category": { "enum": ["preference", "fact", "correction"] },
      "ttl_days": { "type": "integer", "description": "留空表示永久" }
    },
    "required": ["content", "category"]
  }
}`,
  },
};

const MAIN_ARTIFACT: { title: string; kind: ArtifactKind; content: string } = {
  title: "Agent 记忆分层 · 速览笔记",
  kind: "note",
  content: `记忆的三个时间尺度

· 工作记忆 —— 存在于单次推理内：系统提示、最近消息、中间状态。寿命 = 一次推理。
· 短期记忆 —— 对应一次完整会话，边界是会话的开始与结束。
· 长期记忆 —— 跨会话、跨天保留，实现上落到「外部存储 + 检索」。

工程路线速记

· 向量检索：按语义相似度召回，简单好用；短板是「向量近 ≠ 逻辑相关」。
· 图记忆：实体-关系网络，沿关系链查询，天然适合关系型问题。
· Memory-as-Tool：把存 / 查 / 改记忆做成工具，让模型自己决定时机。
· 上下文腐烂：塞得越多，有效注意力越稀；目标是每时刻只拉最相关的一小撮。`,
};

/* ---------------- 初始树 state ---------------- */

export function seedStore(): ThreadTreeState {
  let seq = 1;
  const uid = (p: string) => p + seq++;

  const mainUserMsg: Message = { id: uid("m"), role: "user", text: MAIN_USER, forks: [] };
  const artId = uid("a");
  const mainAssistantMsg: Message = {
    id: uid("m"),
    role: "assistant",
    text: MAIN_ASSISTANT,
    forks: [],
    artifactIds: [artId],
  };

  return {
    threads: {
      main: {
        id: "main",
        parentId: null,
        depth: 0,
        title: "主线",
        anchorText: null,
        forkFromMsgId: null,
        footnote: null,
        children: [],
        messages: [mainUserMsg, mainAssistantMsg],
        lastActive: 1,
      },
    },
    artifacts: {
      [artId]: { id: artId, sourceThreadId: "main", ...MAIN_ARTIFACT },
    },
    artifactOrder: [artId],
    recents: [],
    footnoteCounter: 0,
    seq,
    tick: 1,
  };
}

export function cannedIntro(anchor: string): string {
  for (const k in CANNED) if (anchor.includes(k)) return CANNED[k];
  return `关于「${anchor}」的分支讨论（演示内容）。真实产品里会由模型结合上方继承的上下文给出解释。你可以继续追问，也可以再划选一段文字向更深处展开；按 ⌘K 随时跳回任何一个会话。`;
}

export function artifactSeedFor(anchor: string): ArtifactSeed | null {
  for (const k in ARTIFACT_SEEDS) if (anchor.includes(k)) return ARTIFACT_SEEDS[k];
  return null;
}

export function cannedReply(): string {
  return REPLIES[Math.floor(Math.random() * REPLIES.length)];
}
