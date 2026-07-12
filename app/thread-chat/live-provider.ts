/**
 * live-provider —— 走 /api/thread-chat/reply 的 ReplyProvider 实现（真实模型）。
 *
 * 首次调用先 GET 探测服务端是否配了 key（结果缓存）：不可用则整体回落
 * mock-provider——公开 demo 无 key 也完整可玩，store 与视图层对两种模式无感知。
 *
 * 上下文构造 = P3 的兑现（README §10.2）：system prompt 注入 anchorText（讨论
 * 焦点），继承段沿 lineage 现查、超出字符预算时从最旧处截断（防上下文腐烂）；
 * 留空开的分支（无首问）在**发送线上**代拟一条 user 首问（「展开讲讲…」），
 * 保持 user/assistant 交替协议——UI 侧不落这条代拟消息，与 mock 模式观感一致
 * （调研推荐的「可见代拟首问」形态留待 UI 统一时再切）。
 *
 * 输出净化：只取 delta.content，并流式剥离 <think>…</think> 推理段（MiniMax
 * 等推理模型可能内联输出）；用「累计原文 → 清洗 → 只发增量」的方式做，天然
 * 处理跨 chunk 的半截标签。要求模型输出纯文本（不用 Markdown 标记）——划选
 * 锚点与纯文本渲染的契约在接入富文本渲染（§10.4 残留项）之前保持成立。
 */

import type { ReplyProvider, ReplyRequest } from "./core/provider";
import type { Message } from "./core/types";
import { createMockProvider } from "./mock-provider";

const ENDPOINT = "/api/thread-chat/reply";
/** 继承段的字符预算：超出时丢最旧的（保留分叉点附近的近段上文） */
const INHERITED_CHAR_BUDGET = 6000;

const SYSTEM_BASE = [
  "你是 Thread Chat 里耐心的中文学习助手：用户在读你的回答时会划选任意一段文字开出分支，逐层深入。",
  "回答要求：简明、准确，300 字以内；用纯文本作答（不要使用 Markdown 标记，如 **、#、`、列表符号），段落之间用一个空行分隔。",
].join("\n");

interface WireMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** ReplyRequest → OpenAI 兼容 messages（system + 截断后的继承段 + 本分支消息） */
function toWire(req: ReplyRequest): WireMessage[] {
  const sys = [SYSTEM_BASE];
  if (req.anchorText) {
    sys.push(`本分支的讨论焦点是用户在上文中划选的这段话：「${req.anchorText}」。请围绕它作答。`);
  }

  // 继承段截断：从最新往回装，超预算即止（丢最旧，语义上分叉点附近最相关）
  const inherited: Message[] = [];
  let budget = INHERITED_CHAR_BUDGET;
  for (let i = req.inherited.length - 1; i >= 0; i--) {
    const m = req.inherited[i];
    budget -= m.text.length;
    if (budget < 0 && inherited.length > 0) break;
    inherited.unshift(m);
  }
  if (inherited.length < req.inherited.length) {
    sys.push("（提示：更早的上文因长度限制已省略，以下从中途开始。）");
  }

  // 本分支消息：pending/streaming 占位与 error 残文不进上下文
  const branch = req.messages.filter(
    (m) => !(m.role === "assistant" && m.status && m.status !== "done"),
  );

  const wire: WireMessage[] = [{ role: "system", content: sys.join("\n\n") }];
  for (const m of [...inherited, ...branch]) {
    if (m.text) wire.push({ role: m.role, content: m.text });
  }
  // 留空开分支：线上代拟首问，保住 user/assistant 交替（UI 不落这条消息）
  if (wire[wire.length - 1]?.role !== "user") {
    wire.push({
      role: "user",
      content: req.anchorText
        ? `请展开讲讲「${req.anchorText}」：它具体指什么、为什么重要、和上文的关系。`
        : "请继续。",
    });
  }
  return wire;
}

/** 流式剥离 <think>…</think>：累计原文 → 清洗（含半截标签兜底）→ 只发增量 */
function createThinkStripper(onChunk: (chunk: string) => void) {
  let raw = "";
  let emitted = "";
  const clean = (s: string, final: boolean): string => {
    let out = s.replace(/<think>[\s\S]*?<\/think>/g, "");
    const open = out.lastIndexOf("<think>");
    if (open !== -1) out = out.slice(0, open); // 未闭合的推理段整体扣下
    if (!final) {
      // 结尾可能是半截 <think> / </think> 标签：扣到下一个 chunk 再判
      for (let k = Math.min(8, out.length); k >= 1; k--) {
        const tail = out.slice(-k);
        if ("<think>".startsWith(tail) || "</think>".startsWith(tail)) {
          out = out.slice(0, -k);
          break;
        }
      }
    }
    return out;
  };
  const emit = (final: boolean) => {
    const c = clean(raw, final);
    if (c.startsWith(emitted)) {
      const inc = c.slice(emitted.length);
      if (inc) onChunk(inc);
      emitted = c;
    }
  };
  return {
    push(delta: string) {
      raw += delta;
      emit(false);
    },
    flush() {
      emit(true);
    },
    emittedLength: () => emitted.length,
  };
}

export function createLiveProvider(): ReplyProvider {
  const mock = createMockProvider();
  let liveCheck: Promise<boolean> | null = null;
  const isLive = () => {
    liveCheck ??= fetch(ENDPOINT)
      .then((r) => (r.ok ? (r.json() as Promise<{ live?: boolean }>) : { live: false }))
      .then((j) => !!j.live)
      .catch(() => false);
    return liveCheck;
  };

  return {
    async reply(req, onChunk, signal) {
      if (!(await isLive())) return mock.reply(req, onChunk, signal);

      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "reply", messages: toWire(req) }),
        signal,
      });
      if (!res.ok || !res.body) throw new Error(`reply 请求失败：${res.status}`);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      const strip = createThinkStripper(onChunk);
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? ""; // 半行留到下个网络包
        for (const line of lines) {
          const s = line.trim();
          if (!s.startsWith("data:")) continue;
          const payload = s.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const j = JSON.parse(payload) as {
              choices?: { delta?: { content?: string } }[];
            };
            const delta = j.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) strip.push(delta);
          } catch {
            /* 个别非 JSON 的 SSE 注释行：忽略 */
          }
        }
      }
      strip.flush();
      if (strip.emittedLength() === 0) throw new Error("上游返回了空回复");
    },

    async generateTitle(req) {
      if (!(await isLive())) return mock.generateTitle?.(req) ?? null;
      const firstUser = req.messages.find((m) => m.role === "user")?.text ?? "";
      const firstReply = req.messages.find((m) => m.role === "assistant" && m.text)?.text ?? "";
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "title",
          messages: [
            {
              role: "system",
              content: "为一段分支讨论拟一个 4~8 个字的中文标题。只输出标题本身，不要引号、句号或任何解释。",
            },
            {
              role: "user",
              content: `讨论焦点：「${req.anchorText ?? ""}」\n首问：${firstUser.slice(0, 200) || "（自动展开）"}\n首答摘要：${firstReply.slice(0, 300)}`,
            },
          ],
        }),
      });
      if (!res.ok) return null;
      const j = (await res.json()) as { title?: string };
      const t = (j.title ?? "").replace(/[\s"'「」『』。.．]/g, "");
      return t ? t.slice(0, 12) : null;
    },
  };
}
