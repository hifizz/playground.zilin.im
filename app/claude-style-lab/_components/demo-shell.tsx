import { claudeStyleDemos, type DemoEntry } from "../catalog";

export function DemoShell({ demo, children }: { demo: DemoEntry; children: React.ReactNode }) {
  const index = claudeStyleDemos.findIndex((item) => item.slug === demo.slug);
  const previous = claudeStyleDemos[index - 1];
  const next = claudeStyleDemos[index + 1];

  return (
    <main className="csl-demo-page">
      <nav className="csl-demo-nav" aria-label="Claude HTML Style Lab">
        <a href="/claude-style-lab">← Style Lab</a>
        <div>
          <span>{demo.number} / 08</span>
          <strong>{demo.title}</strong>
        </div>
        <div className="csl-demo-nav__actions">
          <a href={demo.sourceUrl} target={demo.sourceUrl.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
            Source ↗
          </a>
          {next ? <a href={`/claude-style-lab/${next.slug}`}>Next →</a> : <a href="/claude-style-lab">Index →</a>}
        </div>
      </nav>

      <section className="csl-demo-note">
        <div>
          <span>{demo.role}</span>
          <p>{demo.summary}</p>
        </div>
        <div>
          <span>Claude 还原度 · {demo.fidelity}</span>
          <p>{demo.verdict}</p>
        </div>
      </section>

      <div className="csl-stage">{children}</div>

      <footer className="csl-pager">
        <p><span>固定 Brief</span> 为 Agent 工作台制作《上下文不是附件，而是产品》研究摘要。</p>
        <div>
          {previous ? <a href={`/claude-style-lab/${previous.slug}`}>← {previous.number}</a> : <span>← —</span>}
          <b>{demo.number}</b>
          {next ? <a href={`/claude-style-lab/${next.slug}`}>{next.number} →</a> : <span>— →</span>}
        </div>
      </footer>
    </main>
  );
}
