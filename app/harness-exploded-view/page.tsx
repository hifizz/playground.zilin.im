import type { Metadata, Viewport } from "next";
import "./hark.css";
import "./harness.css";
import HarnessApp from "./harness-app";

export const metadata: Metadata = {
  title: "从 0 到 1 实现一个 Agent Harness — 爆炸图",
  description:
    "Agent Harness 的十三个模块从模型接入层到评测的爆炸图拆解，附构建顺序、分包方案与 Pi / AI SDK / Mastra / fx 对照。",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function HarnessExplodedViewPage() {
  return (
    // .hxv 是两个样式表的作用域根；页面固定浅色主题（原静态页 <html data-theme="light">）。
    <div className="hxv" data-theme="light">
      <div className="page" id="top">
        <main>
          <div className="x-wrap">
            <header className="x-hero">
              <p className="x-kicker">2026 年 11 月 · 从 0 到 1</p>
              <h1>实现一个 Agent Harness</h1>
              <p className="x-lede">
                模型接入层借用，从 Loop 往上全部自己写；每一节都拿 Pi Durable 当标准答案对照。
              </p>
            </header>

            <HarnessApp />

            <section className="section" id="others">
              <div className="head">
                <p className="head__eyebrow">对照</p>
                <h2>别人怎么分包</h2>
                <p className="head__sub">源码读于 2026-10-29</p>
              </div>
              <div className="cards x-pkgcards">
                <div>
                  <h3>
                    Pi <small className="x-pkg__mod">earendil-works/pi，v1.4.0</small>
                  </h3>
                  <p>
                    按层拆成 11 个小包，全部在 <code>@earendil-works</code> 下。<code>pi-ai</code>{" "}
                    统一多厂商模型；<code>pi-agent-core</code> 是 agent 运行时，只依赖 pi-ai；
                    <code>pi-durable</code> 是持久化的对话、任务与文档运行时，依赖 pi-ai、pi-codemode、pi-telemetry、chord；
                    <code>pi-env</code> 是 pi-durable 的远程执行环境（SSH 部署的守护进程）；<code>pi-mcp</code>{" "}
                    是独立的 MCP 客户端；<code>pi-codemode</code> 是只能调用注入工具的沙箱 JS；
                    <code>pi-telemetry</code> 是零依赖的遥测合同；<code>pi-evals</code> 做评测；
                    <code>pi-tui</code> 是终端 UI；<code>chord</code> 负责插件、复制状态与 RPC；
                    <code>pi-coding-agent</code> 是 CLI，把上面的包拼起来。Skills 和上下文压缩放在 pi-coding-agent
                    里，没有跨会话记忆。
                  </p>
                </div>
                <div>
                  <h3>
                    AI SDK 7 <small className="x-pkg__mod">ai@7.0.156</small>
                  </h3>
                  <p>
                    按合同拆小包。provider 接口包零依赖；<code>ai</code> 内核；约 45 个模型厂商包；harness 定义
                    HarnessV1，已有 claude-code、codex、cursor、fx、pi 等 11 个适配器；另有 workflow、
                    sandbox-vercel、policy-opa、tool-bash、mcp、otel。没有记忆与 skills。
                  </p>
                </div>
                <div>
                  <h3>Mastra</h3>
                  <p>
                    一个大 <code>@mastra/core</code>（agent、loop、memory、skills、workspace、hooks、storage、evals
                    等 60 多个子模块）＋按类别分目录的适配器：stores 32 个、workspaces 20 个沙箱、observability
                    15 个、channels、server-adapters、deployers。memory 单独成包。
                  </p>
                </div>
                <div>
                  <h3>
                    fx <small className="x-pkg__mod">vercel-labs</small>
                  </h3>
                  <p>
                    Zig 单个二进制，<code>src/core</code> 内分 agent、session、compactor、permissions、hooks、
                    skills、subagent、mcp、workspace；对 JS 只发一个 <code>libfx</code>{" "}
                    包，用子路径导出 node、wasm、durable-*、mcp、skills。没有跨会话记忆。
                  </p>
                </div>
              </div>
              <p className="x-rules x-note">
                借鉴：telemetry 和 MCP 做成零依赖的独立包（Pi）、接口带版本号（AI
                SDK）、适配器按类别分目录（Mastra）、对外一个包加子路径导出（fx）。
              </p>
            </section>

            <footer className="x-foot">
              <span>
                线描渲染：
                <a className="link" href="https://github.com/isaacrowntree/linework" target="_blank" rel="noopener">
                  linework
                </a>
                （MIT）
              </span>
              <span>DWG HARNESS-001 · REV 0.2</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
