import Link from "next/link";
import {
  CpuUsageDemo,
  HeartRateDemo,
  PredictionDemo,
  StressDemo,
} from "./demos";

export default function LivelinePage() {
  return (
    <>
      <Link href="/" className="lv-back" aria-label="Back to playground">
        ← /playground
      </Link>

      <main className="lv-container">
        <header className="lv-header">
          <span className="lv-meta">8 May, 2026</span>
          <h1>Liveline</h1>
          <p className="lv-tagline">
            Real-time animated line charts for React. One <code>&lt;canvas&gt;</code>,
            zero CSS imports, smooth interpolation between updates.
          </p>
        </header>

        <article className="lv-article">
          <p>
            This is a tribute / re-skin of <a className="lv-link" href="https://benji.org/liveline" target="_blank" rel="noreferrer">
              benji.org/liveline
            </a>
            . Same library, same demos, our own typography sandbox — built to study
            how a single column of muted text plus a few embedded charts feels so
            much more alive than yet another marketing landing page.
          </p>

          <p>
            The library is <strong>liveline</strong> by{" "}
            <a className="lv-link" href="https://github.com/benjitaylor/liveline" target="_blank" rel="noreferrer">
              @benjitaylor
            </a>
            . It does <em>one thing</em> — draws a line that moves smoothly when a
            number changes — and everything else (momentum, candles, orderbook,
            multi-series, degen particles) is opt-in.
          </p>

          {/* ─── Getting started ─────────────────────────────── */}
          <div className="lv-section" role="separator">
            <span>Getting started</span>
          </div>

          <p>
            Pass a growing array of <code>{`{ time, value }`}</code> points and the
            latest value. Liveline interpolates between updates so even sparse data
            renders smooth at 60fps.
          </p>

          <pre>
            <code>{`import { Liveline } from 'liveline'

function Chart({ data, value }) {
  return (
    <div style={{ height: 200 }}>
      <Liveline data={data} value={value} />
    </div>
  )
}`}</code>
          </pre>

          {/* ─── Heart rate demo ─────────────────────────────── */}
          <div className="lv-section" role="separator">
            <span>Heart rate</span>
          </div>

          <div className="lv-demo">
            <div className="lv-demo-frame">
              <HeartRateDemo />
            </div>
            <div className="lv-demo-caption">
              <span>
                <b>Calm signal · custom formatter.</b> A gentle sinusoid plus
                jitter. <code>exaggerate</code> tightens the Y-axis so small moves
                fill the chart.
              </span>
              <span className="lv-demo-tag">{`<Liveline exaggerate />`}</span>
            </div>
          </div>

          {/* ─── CPU usage ──────────────────────────────────── */}
          <div className="lv-section" role="separator">
            <span>CPU usage</span>
          </div>

          <p>
            A random walk with the occasional spike — the kind of trace you stare
            at on a flaky service. The reference line at <code>80%</code> is just a
            number; Liveline draws the dashed guide and label.
          </p>

          <div className="lv-demo">
            <div className="lv-demo-frame" data-theme="light">
              <CpuUsageDemo />
            </div>
            <div className="lv-demo-caption">
              <span>
                <b>Light theme.</b> Auto-detected momentum, fill gradient, badge
                tail tracking the chart tip.
              </span>
              <span className="lv-demo-tag">referenceLine</span>
            </div>
          </div>

          {/* ─── Multi-series ────────────────────────────────── */}
          <div className="lv-section" role="separator">
            <span>Multi-series</span>
          </div>

          <p>
            Pass <code>series</code> instead of <code>data</code> to draw multiple
            overlapping lines that share one axis. Toggle chips appear when there
            are 2+ series — clicking hides that line with a smooth fade and the
            Y-axis re-fits.
          </p>

          <div className="lv-demo">
            <div className="lv-demo-frame" data-theme="light">
              <PredictionDemo />
            </div>
            <div className="lv-demo-caption">
              <span>
                <b>Prediction market.</b> Three outcomes summing to 100%. Click a
                chip to toggle a series.
              </span>
              <span className="lv-demo-tag">series[]</span>
            </div>
          </div>

          {/* ─── Stress test ─────────────────────────────────── */}
          <div className="lv-section" role="separator">
            <span>Stress test</span>
          </div>

          <p>
            The classic breaking points: high-frequency ticks, sharp reversals,
            isolated spikes on a flat line, full chaos. Crank it up and watch the
            line keep its composure.
          </p>

          <div className="lv-demo">
            <StressDemo />
            <div className="lv-demo-caption">
              <span>
                <b>~60ms ticks.</b> <code>showValue</code> renders a 60fps live
                value overlay (DOM mutation, no React re-renders).{" "}
                <code>degen</code> fires particles on big swings.
              </span>
              <span className="lv-demo-tag">stress</span>
            </div>
          </div>

          {/* ─── Just a line ─────────────────────────────────── */}
          <div className="lv-section" data-decor="dots" role="separator" />

          <p>
            Liveline can do a lot — momentum arrows, particles, orderbooks,
            scrubbing, time windows, candles. But at the end of the day, if you
            just want <em>a line that moves when a number changes</em>, it does
            that just fine too.
          </p>

          <p className="lv-soft" style={{ color: "var(--lv-text-softer)" }}>
            Source · <a className="lv-link" href="https://github.com/benjitaylor/liveline" target="_blank" rel="noreferrer">github.com/benjitaylor/liveline</a>
            <span style={{ padding: "0 0.5rem", opacity: 0.4 }}>·</span>
            Original page · <a className="lv-link" href="https://benji.org/liveline" target="_blank" rel="noreferrer">benji.org/liveline</a>
          </p>
        </article>
      </main>
    </>
  );
}
