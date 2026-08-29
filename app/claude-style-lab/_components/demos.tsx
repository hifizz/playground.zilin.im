import type { DemoKind } from "../catalog";

export function DemoCanvas({ kind }: { kind: DemoKind }) {
  switch (kind) {
    case "claude-design": return <ClaudeDesign />;
    case "design-workflow": return <DesignWorkflow />;
    case "web-artifacts-builder": return <ArtifactsBuilder />;
    case "frontend-design": return <FrontendDesign />;
    case "brand-guidelines": return <BrandGuidelines />;
    case "design-card": return <DesignCard />;
    case "visual-style-guide": return <VisualStyleGuide />;
    case "editorial-synthesis": return <EditorialSynthesis />;
  }
}

function ClaudeDesign() {
  return (
    <article className="artifact yacey">
      <header className="yacey__mast"><span>FIELD NOTE · AGENT SYSTEMS</span><span>Paper · Ink · Rust</span></header>
      <section className="yacey__hero">
        <span className="num">01</span>
        <div><small>A research memo on context</small><h1>Context is not a window.<em>It is the room.</em></h1><p>一个 Agent 产品真正的界面，不是聊天框，而是它如何保存、组织并在正确时刻重新呈现工作的来龙去脉。</p></div>
      </section>
      <section className="yacey__body">
        <aside><small>Working thesis</small><p>当上下文只能被“附加”，用户就在替系统做记忆工作。</p><b>68%</b><span>sample context reuse</span></aside>
        <div><p className="lead">好的上下文系统不会让人管理“更多资料”。它把散落的资料压缩成正在推进的判断。</p><div className="two"><div><h2>从附件到环境</h2><p>附件是一次性输入；环境是持续存在的约束。稳定背景应当可复用，而不是每轮重新拼装。</p></div><div><h2>从召回到关系</h2><p>搜索只能回答“在哪里”。真正有价值的是说明新信息与目标、争议和下一步之间是什么关系。</p></div></div><blockquote>“记住”不是保存更多，而是让重要的东西在正确的判断面前重新变得可见。</blockquote></div>
      </section>
    </article>
  );
}

function DesignWorkflow() {
  return (
    <article className="artifact workflow">
      <header><div><small>DESIGN DIRECTION ADVISOR</small><h1>先选方向，再写组件。</h1></div><p>这个 Skill 的价值是流程，不是 Claude 外观：核验事实、盘点品牌资产、声明视觉系统，再比较真正不同的方向。</p></header>
      <div className="workflow__brief"><span><b>01</b> Brief<br/><strong>Agent context memo</strong></span><span><b>02</b> Audience<br/><strong>AI product builders</strong></span><span><b>03</b> Job<br/><strong>Choose a system</strong></span></div>
      <section className="directions">
        <article className="direction editorial"><small>A · Editorial archive</small><h2>Context is the room.</h2><i/><i/><i/><footer>Literary · quiet · evidence-first</footer></article>
        <article className="direction instrument"><small>B · Context instrument</small><strong>68%</strong><div className="bars"><i/><i/><i/><i/></div><footer>Operational · dense · live</footer></article>
        <article className="direction index"><small>C · Living index</small><div className="nodes"><span>Capture</span><span>Relate</span><span>Resurface</span></div><footer>Systemic · spatial · exploratory</footer></article>
      </section>
      <footer className="workflow__decision"><small>PROCESS VERDICT</small><p>最终只吸收它的“先定义系统、再实现、再浏览器核验”，不把它当作 Claude Style Token 来源。</p></footer>
    </article>
  );
}

function ArtifactsBuilder() {
  const rows = ["Generation run architecture", "Forked conversation model", "Project-aware memory notes"];
  return (
    <article className="artifact builder">
      <aside><strong>Context Observatory</strong><nav><span className="active">Overview</span><span>Sources <b>24</b></span><span>Claims <b>08</b></span><span>Runs <b>13</b></span></nav><footer>● all sources resolved</footer></aside>
      <main><header><div><small>Workspace / Agent memory</small><strong>Context is the product</strong></div><button>Export</button></header><section className="builder__content"><div className="builder__title"><div><small>RESEARCH ARTIFACT</small><h1>Where context creates leverage</h1><p>Track how capture, relation and resurfacing change the cost of every new agent run.</p></div><div><span>Context reuse</span><strong>68%</strong><small>sample data</small></div></div><div className="builder__grid"><section className="chart"><header><strong>Reuse across runs</strong><small>Inherited context / total input</small></header><div className="chart__bars">{[34,42,38,49,46,54,57,61,58,65,63,68].map((v,i)=><i key={i} style={{height:`${v}%`}}/>)}</div></section><section className="inspector"><small>ACTIVE CLAIM</small><h2>“Context should behave like an environment.”</h2><dl><div><dt>Confidence</dt><dd>High · 0.86</dd></div><div><dt>Evidence</dt><dd>7 sources</dd></div><div><dt>Used by</dt><dd>3 decisions</dd></div></dl><button>Open evidence trail</button></section></div><section className="builder__table"><header><strong>Evidence queue</strong><span>Status</span></header>{rows.map((row,i)=><div key={row}><strong>{row}</strong><span>{i===2?"Needs review":"Linked"}</span><time>{i===0?"Today":i===1?"Yesterday":"Aug 24"}</time></div>)}</section></section></main>
    </article>
  );
}

function FrontendDesign() {
  return (
    <article className="artifact tide">
      <header><span className="tide__mark">CO</span><div>Context Observatory · field report 04</div></header>
      <section className="tide__hero"><div><small>THE MEMORY TIDE</small><h1>Every agent run<em>changes the shoreline.</em></h1><p>把上下文窗口想成容器，产品只会不断塞入更多信息；把它想成潮汐，系统才会关心什么应当留下、退去，以及何时再次出现。</p></div><div className="moon"><strong>68</strong><span>% reuse</span></div></section>
      <section className="tide__wave" aria-label="Context tide: capture, relate, resurface"><svg viewBox="0 0 1200 300"><path d="M0 238 C140 260 190 175 320 190 C470 208 500 72 650 105 C780 135 850 48 960 68 C1050 84 1110 29 1200 42 L1200 300 L0 300 Z"/><polyline points="0,238 120,245 230,192 320,190 475,203 545,120 650,105 780,135 900,72 960,68 1080,65 1200,42"/></svg><div><span>01 Capture</span><span>02 Relate</span><span>03 Resurface</span></div></section>
      <section className="tide__finding"><div><small>FINDING 01</small><h2>Persistence without relevance becomes sediment.</h2></div><p>记忆不是无限增长的日志。每条信息都要有来源、适用范围、置信度与失效条件，才能从“保存”升级为“可用于判断”。</p><aside>唯一的视觉冒险：用“潮汐仪器”组织页面，而不是通用卡片网格。</aside></section>
    </article>
  );
}

function BrandGuidelines() {
  const colors = [["Dark","#141413"],["Light","#FAF9F5"],["Light Gray","#E8E6DC"],["Mid Gray","#B0AEA5"],["Orange","#D97757"],["Blue","#6A9BCC"],["Green","#788C5D"]];
  return (
    <article className="artifact brand">
      <header><div><small>ANTHROPIC BRAND SPECIMEN</small><h1>Context is the product.</h1><p>这一页只服从公开 brand-guidelines Skill：颜色是可靠锚点；字体用它指定的 Poppins / Arial 与 Lora / Georgia 逻辑。</p></div><b>AI</b></header>
      <section><h2><span>01</span> Color system</h2><div className="swatches">{colors.map(([name,value])=><div key={name} style={{background:value,color:name==="Dark"?"#faf9f5":"#141413"}}><strong>{name}</strong><code>{value}</code></div>)}</div></section>
      <section className="brand__type"><h2><span>02</span> Typography</h2><div><article><small>HEADING · POPPINS / ARIAL</small><h3>Memory should reduce work, not create a filing habit.</h3></article><article><small>BODY · LORA / GEORGIA</small><p>A useful context system turns source material into decisions, relationships and future actions. It is measured by repeated work removed—not by documents stored.</p></article></div></section>
    </article>
  );
}

function DesignCard() {
  return (
    <div className="digest-stage"><article className="artifact digest"><header><div><small>THE CONTEXT DIGEST · NO. 04</small><h1>上下文不是附件，而是产品。</h1><p>一页看懂 Agent 产品为什么必须从“传入信息”升级为“持续环境”。</p></div><aside>RESEARCH<br/><strong>08.29</strong></aside></header><section className="digest__summary"><small>EXECUTIVE SUMMARY</small><p>当用户每次都要重新选择文件、解释背景、指出旧决定时，产品只是一个模型入口。真正的 Agent 工作台会把上下文组织成可追溯、可失效、可复用的工作环境。</p></section><section className="digest__metrics"><div><small>REUSE RATE</small><strong>68%</strong><span>sample</span></div><div><small>CORE LOOP</small><ol><li>01 · Capture</li><li>02 · Relate</li><li>03 · Resurface</li></ol></div></section><section className="digest__shift"><small>THE SHIFT</small><div><article><b>BEFORE · ATTACHMENT</b><h2>用户负责记忆</h2><p>文件按请求临时加入；来源、适用范围和过期状态缺失；每轮重新解释。</p></article><article><b>AFTER · ENVIRONMENT</b><h2>系统负责关系</h2><p>信息围绕项目、判断和行动组织；稳定前缀复用；变化内容独立注入。</p></article></div></section><footer><small>NEXT DECISION</small><p>定义自动进入 Prompt 的稳定层，以及仅供检索和追溯的证据层。</p></footer></article></div>
  );
}

function VisualStyleGuide() {
  return (
    <article className="artifact styleguide"><header><div><b>C</b><strong>Component guide</strong></div><nav>Components · Patterns · ◐</nav></header><section className="styleguide__hero"><div><small>DESIGN SYSTEM · 1.0</small><h1>Agent context workspace</h1><p>Machine-readable semantic tokens, shadcn-style primitives, responsive layouts and a required dark-mode counterpart.</p></div><button>View tokens</button></section><section className="tokens"><div><i className="white"/><span>background</span><code>#ffffff</code></div><div><i className="black"/><span>primary</span><code>#030213</code></div><div><i className="muted"/><span>muted</span><code>#ececf0</code></div><div><i className="red"/><span>destructive</span><code>#d4183d</code></div></section><section className="components"><article><h2>Buttons</h2><div><button>Save changes</button><button className="outline">Open source</button><button className="ghost">Cancel</button></div></article><article><h2>Form field</h2><label>Project context<input readOnly value="Agent memory research"/><small>Used to scope sources and decisions.</small></label></article><article><h2>Alert</h2><aside><b>i</b><p><strong>Context synced</strong><span>24 sources are available to the next run.</span></p></aside></article><article><h2>Empty state</h2><div className="empty"><b>+</b><strong>No saved claims</strong><p>Extract a claim from a source to start a reusable evidence trail.</p></div></article></section><section className="styleguide__dark"><div><small>DARK MODE · REQUIRED</small><h2>Same components, inverted semantic tokens.</h2></div><article><small>CONTEXT REUSE</small><strong>68%</strong><i><b/></i><p>Sample indicator</p></article></section></article>
  );
}

function EditorialSynthesis() {
  return (
    <article className="artifact synthesis">
      <aside className="synthesis__rail"><header><small>CLAUDE STYLE RECONSTRUCTION</small><strong>Editorial artifact</strong></header><nav><a href="#thesis">01 · Thesis</a><a href="#system">02 · System</a><a href="#evidence">03 · Evidence</a><a href="#decision">04 · Decision</a></nav><div><small>CONTEXT REUSE</small><strong>68<em>%</em></strong><p>演示数据 · 稳定前缀应被继承，而不是重新生成。</p></div><footer><i/> Light / Dark / Orange / Green</footer></aside>
      <main className="synthesis__paper"><header><div>RESEARCH NOTE · 04 / AGENT PRODUCT SYSTEMS</div><time>29 AUGUST 2026</time></header><section className="synthesis__hero" id="thesis"><span>01</span><div><small>THE GOVERNING IDEA</small><h1>上下文不是附件，<em>而是产品运行的房间。</em></h1><p>当 Agent 只能接收“这一次传入的资料”，用户就必须不断替系统回忆。真正的工作台会让稳定背景成为环境，让变化信息成为事件，让每个判断都能追溯到证据。</p></div></section><section className="synthesis__section" id="system"><header><span>02 · System</span><h2>三层上下文，而不是一个不断膨胀的 Prompt。</h2></header><div className="principles"><article><small>STABLE</small><h3>稳定前缀</h3><p>角色、产品规则、项目约束与长期决定。顺序和字节尽量稳定，以获得缓存收益。</p><footer>Cache · high reuse</footer></article><article><small>WORKING</small><h3>工作上下文</h3><p>当前分支、最近对话、任务状态与已选证据。围绕一次 Generation Run 组织。</p><footer>Scope · run-bound</footer></article><article><small>RETRIEVED</small><h3>按需证据</h3><p>只在具体判断需要时注入，并保留来源、时间、置信度和失效条件。</p><footer>Trace · source-linked</footer></article></div></section><section className="synthesis__section" id="evidence"><header><span>03 · Evidence</span><h2>衡量系统是否真的减少了用户工作。</h2></header><div className="evidence"><blockquote><small>WORKING DEFINITION</small><p>好的记忆不是知道得更多，而是在下一次行动前，减少用户必须重新说明的内容。</p><cite>Context quality rubric · demo copy</cite></blockquote><div className="ledger"><div><span>Signal</span><span>Now</span><span>Target</span></div><div><strong>Inherited prefix</strong><span>68%</span><span>75%</span></div><div><strong>Repeated explanation</strong><span>2.4×</span><span>&lt;1.2×</span></div><div><strong>Evidence with provenance</strong><span>81%</span><span>95%</span></div></div></div></section><section className="decision" id="decision"><div><small>04 · DECISION</small><h2>先建立语义边界，再优化缓存。</h2></div><p>分叉对话应继承一个不可变语义快照；Prompt 稳定层保持顺序和字节一致；分叉后新增辅助说明放在稳定前缀之后，避免为了帮助模型理解反而让继承上下文失去缓存命中。</p></section><footer className="synthesis__foot">CLAUDE EDITORIAL ARTIFACT · PUBLIC ANTHROPIC COLOR TOKENS · INDEPENDENT IMPLEMENTATION · NO REPLACEMENT HUES</footer></main>
    </article>
  );
}
