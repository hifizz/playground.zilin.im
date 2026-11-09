// 文案数据：13 个模块的名称与详情（what/how/pit/pi 内含 <code> HTML，原样来自静态页）。
import { MODULE_IDS, type ModuleId } from "../scene/harness-scene";

export type { ModuleId };
export { MODULE_IDS };

export interface ModuleInfo {
  name: string;
  sub: string;
  hover: string;
  what: string;
  how: string;
  pit: string;
  pi: string;
}

export const MODULE_INFO: Record<ModuleId, ModuleInfo> = {
  provider: {
    name: "模型接入层",
    sub: "借用，虚线表示",
    hover: "多厂商流式调用，直接用 pi-ai 或 AI SDK core。",
    what: "统一各家模型的流式输出、工具调用格式、重试与限流。",
    how: "不自己写，只包一层 <code>stream(messages, tools)</code> 接口；重试、限流退避、主模型失败时降级到备用模型。",
    pit: "reasoning/thinking 签名要原样回传；切模型时历史消息格式不兼容。",
    pi: "Pi 用自家 pi-ai，同样把它放在 harness 之外。",
  },
  loop: {
    name: "Agent Loop",
    sub: "心脏",
    hover: "约 200 行的心脏：调模型 → 执行工具 → 回填 → 判断停止。",
    what: "每一轮的状态机。",
    how: "while 循环 + 显式状态（idle/streaming/tool_running/waiting_approval/done），最大轮数和预算熔断。",
    pit: "停止条件不止「没有工具调用」，还有预算、错误、用户中断。",
    pi: "Pi 的 <code>conversation.submit().wait()</code> 背后就是这一层。",
  },
  tools: {
    name: "工具层 / MCP",
    sub: "统一注册表",
    hover: "统一的工具注册表，内置工具和 MCP 工具走同一条链路。",
    what: "schema 声明、参数校验、执行、结果截断、错误回填。",
    how: "<code>Tool = {name, schema, run(ctx)}</code>；MCP client 支持 stdio 和 streamable HTTP，把远端工具映射进同一注册表。",
    pit: "各家支持的 JSON Schema 子集不同；stdio 进程管理与断线重连；错误要当作内容回给模型而不是抛异常。",
    pi: "Pi 的工具用 TypeBox 声明。",
  },
  eventlog: {
    name: "事件日志",
    sub: "唯一事实源",
    hover: "只追加的 JSONL，唯一事实源；记忆、UI、续跑都是它的投影。",
    what: "记录每条消息、工具调用、token 用量。",
    how: "append-only 文件或 SQLite 表，状态全部由 <code>reduce(events)</code> 推导。",
    pit: "schema 演进与迁移；trace 必须 agent 改不了。",
    pi: "Pi Durable 用 SQLite 存事件，迁移单向。",
  },
  context: {
    name: "上下文与压缩",
    sub: "token 预算",
    hover: "带 token 预算的组装流水线，压缩策略可插拔。",
    what: "system → skills 索引 → 记忆 → 历史 → 工具结果，按预算组装。",
    how: "前缀稳定以命中 prompt cache；三种压缩：截断旧工具结果、大结果存文件只留引用、摘要旧轮次。",
    pit: "tool_call 与 tool_result 必须成对保留；压缩会破坏缓存前缀导致成本突跳。",
    pi: "Pi 内置 compaction。",
  },
  skills: {
    name: "Skills",
    sub: "渐进式披露",
    hover: "渐进式披露：prompt 里只放名字和描述，用时才加载。",
    what: "让「怎么做」按需进入上下文。",
    how: "扫描 <code>skills/*/SKILL.md</code> 生成索引；<code>load_skill</code> 是普通工具。",
    pit: "索引太长同样吃上下文；多个 skill 描述相近时模型选错。",
    pi: "与 Claude Code 的 Skills 机制同构；fx 也读取 <code>.claude/skills</code> 与 <code>.agents/skills</code>。",
  },
  memory: {
    name: "Memory 记忆",
    sub: "跨会话",
    hover: "跨会话的「记得什么」：事实与偏好的写入、召回、去重、过期、删除。",
    what: "让 agent 记得用户和项目，而不是每次从零开始。",
    how: "记忆是 markdown 文件或带 embedding 的表；写入经过去重与冲突合并，召回按语义 + 时间排序注入上下文；记忆读写也是工具。",
    pit: "提示注入污染记忆；新旧事实冲突要以最近、用户亲口说的为准；用户要求删除时必须删干净。",
    pi: "Mastra 把 memory 单独成包；AI SDK 和 fx 都不内置跨会话记忆。",
  },
  policy: {
    name: "控制面",
    sub: "权限 · 审批 · 预算",
    hover: "权限、人工审批、预算和步数上限、hooks，全部在这一层拦截。",
    what: "决定每个工具调用是允许、拒绝还是问人；限制 token、费用和轮数。",
    how: "策略引擎在工具调用前后挂 hooks；审批进入 <code>waiting_approval</code> 状态并持久化暂停；预算超限熔断。",
    pit: "审批可能要等一天；策略写死在 prompt 里等于没有。",
    pi: "AI SDK 有 policy-opa 包；fx 有 permissions 与 hooks 模块。",
  },
  sandbox: {
    name: "执行环境",
    sub: "ExecEnv · 沙箱",
    hover: "一套执行接口跑本地、Docker、云沙箱；密钥在出站代理注入，永不进沙箱。",
    what: "文件、进程、端口预览、快照。",
    how: "ExecEnv 接口 + 出站代理按需注入 token + 网络 allowlist。",
    pit: "不可信内容里的提示注入。",
    pi: "Pi 的 ExecutionEnv。",
  },
  subagents: {
    name: "子 Agent 编排",
    sub: "fan-out",
    hover: "子 agent 就是一个工具：独立上下文，只回传摘要。",
    what: "fan-out 并行、递归深度和预算限制。",
    how: "<code>spawn_agent(task)</code> 新开一个 loop 实例，共享 ExecEnv 或独立 worktree，结果压缩后回填。",
    pit: "共享工作目录写冲突；kill switch 要级联停掉所有子 agent 并吊销凭证。",
    pi: "Pi 有子 agent 与任务图；Codeg 默认深度 1。",
  },
  gateway: {
    name: "入口与会话",
    sub: "CLI · HTTP/SSE · IM",
    hover: "CLI、HTTP/SSE、IM、定时任务、webhook 都汇入同一个 session。",
    what: "接收输入、流式推送输出、处理插话与打断、同一会话的并发排队。",
    how: "每个入口是一个适配器，把消息转成 session 事件；AbortSignal 贯穿模型请求、子进程、MCP；steer 消息在当前工具批结束后注入，follow-up 排队。",
    pit: "同一会话两条消息同时到；僵尸进程；插话语义（等还是打断）要定清楚。",
    pi: "Pi 区分 steer 与 follow-up；fx 用 ACP 对接编辑器；Mastra 有 channels 与 server-adapters。",
  },
  telemetry: {
    name: "可观测性",
    sub: "trace · 成本",
    hover: "订阅事件流，输出 trace、工具耗时与失败率、token 与费用。",
    what: "出了问题能回放，能看到钱花在哪。",
    how: "横切包订阅事件日志，导出 OpenTelemetry span；按会话、工具、模型聚合成本。",
    pit: "trace 里的密钥与隐私要脱敏；采样率太低时抓不到偶发故障。",
    pi: "AI SDK 有 otel 与 devtools；Mastra 有 15 个 observability 适配器。",
  },
  eval: {
    name: "评测",
    sub: "Eval",
    hover: "20 个小任务的测试集，每加一层都用数据证明它有用。",
    what: "记录成功率、轮数、token、成本。",
    how: "固定任务集 + 可重放 trace，CI 每次跑。",
    pit: "模型随机性，需要多次采样取均值。",
    pi: "作者此前的 GUI bench：无障碍树让成功率从 18% 到 100%。",
  },
};

export function num(id: ModuleId): string {
  const i = MODULE_IDS.indexOf(id);
  return (i < 10 ? "0" : "") + i;
}

export function isModuleId(v: string | undefined): v is ModuleId {
  return v !== undefined && (MODULE_IDS as readonly string[]).includes(v);
}
