/**
 * mock-provider —— demo 期的 ReplyProvider 实现：canned 内容按节奏流式吐出。
 *
 * 与 data.ts 同属「演示内容」层：接真实模型时本文件与 data.ts 一起退役，
 * 换成走 API 路由的 provider（core/provider.ts 接口不变，store 与视图层零改动）。
 *
 * 节奏设计：整条回复分约 12 段、每段 22ms —— 打字机观感可感知，又保证在
 * ~300ms 内流完（E2E 回归契约 verify2–5 的既有等待窗以内）。
 *
 * 测试钩子：最后一条 user 消息含「[error]」时，流出 3 段后抛错 —— 供
 * error/重试态的 E2E 断言与手动演示使用。
 */

import type { ReplyProvider, ReplyRequest } from "./core/provider";
import { cannedIntro, cannedReply } from "./data";

const TICKS = 12;
const TICK_MS = 22;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 分支首答用锚点话题的 canned 内容，其后的追问用轮换的演示回复 */
function pickText(req: ReplyRequest): string {
  const assistantCount = req.messages.filter((m) => m.role === "assistant").length;
  if (req.anchorText && assistantCount === 1) return cannedIntro(req.anchorText);
  return cannedReply();
}

export function createMockProvider(): ReplyProvider {
  return {
    async reply(req, onChunk) {
      const lastUser = [...req.messages].reverse().find((m) => m.role === "user");
      const fail = lastUser?.text.includes("[error]") ?? false;
      const text = pickText(req);
      const step = Math.max(1, Math.ceil(text.length / TICKS));
      for (let i = 0; i < text.length; i += step) {
        await sleep(TICK_MS);
        if (fail && i >= step * 3) throw new Error("mock stream failure");
        onChunk(text.slice(i, i + step));
      }
    },
  };
}
