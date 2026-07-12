/**
 * /api/thread-chat/reply —— Thread Chat 的模型代理路由（README §10 的最后一块）。
 *
 * 后端 = 任意 OpenAI 兼容服务（当前按 MiniMax 配置）。key 只存在服务端环境变量，
 * 客户端经本路由中转；未配置 key 时 POST 返回 503，客户端 live-provider 会
 * 自动回落 mock（GET 先探测可用性，公开 demo 因此无 key 也完整可玩）。
 *
 * 三个入口：
 * · GET            → { live, model }：可用性探测（顶栏 pill 与 provider 共用）；
 * · POST mode=reply → SSE 透传上游 chat/completions 流（客户端解析 delta.content）；
 * · POST mode=title → 非流式小调用，返回 { title }（分支自动标题，§10.5）。
 *
 * 环境变量：MINIMAX_API_KEY（必需）/ MINIMAX_BASE_URL（默认国际站）/
 * LLM_MODEL_ID（默认 MiniMax-M2）。本地容器里跑要让 Node fetch 走出站代理：
 * `NODE_USE_ENV_PROXY=1 pnpm start`（Node 22+ 的 EnvHttpProxyAgent；Vercel 上不需要）。
 */

import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const BASE = () => process.env.MINIMAX_BASE_URL || "https://api.minimaxi.com/v1";
const MODEL = () => process.env.LLM_MODEL_ID || "MiniMax-M2";

interface WireMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const ROLES = new Set(["system", "user", "assistant"]);

export async function GET() {
  const live = !!process.env.MINIMAX_API_KEY;
  return Response.json({ live, model: live ? MODEL() : null });
}

export async function POST(req: NextRequest) {
  const key = process.env.MINIMAX_API_KEY;
  if (!key) return Response.json({ error: "MINIMAX_API_KEY 未配置" }, { status: 503 });

  let body: { mode?: string; messages?: WireMessage[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }
  const messages = (body.messages ?? [])
    .filter((m) => m && ROLES.has(m.role) && typeof m.content === "string" && m.content.length > 0)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 24_000) }))
    .slice(-64);
  if (messages.length === 0) return Response.json({ error: "messages 为空" }, { status: 400 });
  const isTitle = body.mode === "title";

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE()}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL(),
        messages,
        stream: !isTitle,
        temperature: isTitle ? 0.2 : 0.7,
        max_tokens: isTitle ? 48 : 1200,
      }),
    });
  } catch (e: unknown) {
    // 连不上上游（网络策略 / DNS / 代理）：502 让客户端置 error 态可重试
    return Response.json(
      { error: "上游连接失败", detail: e instanceof Error ? e.message.slice(0, 200) : String(e) },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return Response.json(
      { error: `上游返回 ${upstream.status}`, detail: detail.slice(0, 300) },
      { status: 502 },
    );
  }

  if (isTitle) {
    const j = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = j.choices?.[0]?.message?.content ?? "";
    return Response.json({ title: raw.trim().slice(0, 24) });
  }

  // SSE 透传：解析留给客户端（live-provider），路由零缓冲
  return new Response(upstream.body, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
    },
  });
}
