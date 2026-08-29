import { claudeStyleDemos } from "./catalog";

export const metadata = {
  title: "Claude HTML Style Lab · playground",
  description: "同一份 Brief 对照七个 Claude / Anthropic 相关 Skill，并展示一个只使用官方公开颜色 token 的 Claude 风格复刻 Skill。",
};

export default function ClaudeStyleLabPage() {
  return (
    <main className="csl-index">
      <header className="csl-index__hero">
        <nav><a href="/">← playground.zilin.im</a><span>Claude HTML Style Lab · 2026</span></nav>
        <div className="csl-index__hero-grid"><div><small>SEVEN SOURCES · ONE RECONSTRUCTION</small><h1>同一份 Brief，<em>八种生成逻辑。</em></h1><p>这不是八套换色主题。我们分别验证视觉系统、设计流程、Artifact Runtime、品牌规范、内容卡片和组件库到底贡献了什么，最后按 Anthropic 公开的官方颜色 token 收敛成一个可复用的 Claude 风格复刻 Skill。</p></div><aside><small>EVALUATION BRIEF</small><h2>上下文不是附件，而是产品。</h2><p>为 Agent 工作台制作一页研究摘要：读者需要先理解判断，再看到证据和下一步行动。</p><dl><div><dt>固定</dt><dd>主题与信息层级</dd></div><div><dt>变化</dt><dd>排版、结构、组件</dd></div><div><dt>偏好</dt><dd>官方 Light + Dark + Green</dd></div></dl></aside></div>
      </header>

      <section className="csl-index__notes"><p><b>01</b><span><strong>来源忠实。</strong> 每个 Demo 先遵守原 Skill 的真实边界，即使结果不像 Claude，也不替它美化。</span></p><p><b>02</b><span><strong>官方色值。</strong> 最终 Skill 只保留 Dark、Light、Light Gray、Mid Gray、Orange、Blue 与 Green 七个基础颜色 token。</span></p><p><b>03</b><span><strong>#2 降级为流程。</strong> claude-design-skill 不再被当成视觉方案，只演示它如何做设计判断。</span></p></section>

      <section className="csl-index__list"><header><div><small>COMPARATIVE SET</small><h2>逐个验收</h2></div><p>建议按 01 → 08 浏览。视觉上重点比较 01、05、06 与最终复刻版 08；03、04、07 更适合观察能力边界。</p></header><div className="csl-index__grid">{claudeStyleDemos.map((demo)=><a key={demo.slug} href={`/claude-style-lab/${demo.slug}`} className={demo.number==="08"?"featured":""}><Preview number={demo.number}/><div className="meta"><span>{demo.role}</span><span>还原度 · {demo.fidelity}</span></div><h3>{demo.title}</h3><p>{demo.summary}</p><footer><span>{demo.verdict}</span><b>↗</b></footer></a>)}</div></section>

      <section className="csl-index__final"><div>08</div><article><small>RECOMMENDED ARCHITECTURE</small><h2>官方视觉 Token、设计判断、Artifact 构建，必须分层。</h2><p>复刻 Skill 固定 Anthropic 公开的 Dark / Light / Gray / Orange / Blue / Green 与 Claude 式排版；通用设计 Skill 负责主题和构图判断；web-artifacts-builder 负责 React、状态与交付。这样既保持还原度，也避免多个 Skill 在同一轮里互相改色。</p><a href="/claude-style-lab/08-claude-editorial-artifact">查看官方 Token 复刻版 →</a></article></section>
    </main>
  );
}

function Preview({ number }: { number: string }) {
  return <div className={`preview preview--${number}`} aria-hidden="true"><span>{number}</span><i/><b/></div>;
}
