export function Hero({ demoCount }: { demoCount: number }) {
  return (
    <section className="relative overflow-hidden border-b border-neutral-800/60">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.10) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-6 pt-10 pb-8 sm:px-10 sm:pt-14 sm:pb-12">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neutral-700/80 bg-neutral-900/60 px-3 py-1 backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-neutral-400">
            playground · zilin.im
          </span>
        </div>

        <h1
          className="mb-3 text-4xl font-semibold text-neutral-50 sm:text-6xl"
          style={{ letterSpacing: "-0.045em", lineHeight: 0.98 }}
        >
          Interaction patterns{" "}
          <span className="text-neutral-500">for the AI era.</span>
        </h1>

        <p
          className="mb-5 max-w-2xl text-sm leading-relaxed text-neutral-400 sm:text-base"
          style={{ letterSpacing: "-0.011em" }}
        >
          专为 designer、developer、founder 而做的 UI/UX 实验室。
          每个 demo 都是可复制、可安装的 shadcn 组件，
          研究 AI agent 时代的产品交互该长什么样。
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="#demos"
            className="group inline-flex items-center gap-1.5 rounded-full bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-900 transition-all hover:bg-white hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
          >
            Browse {demoCount} demos
            <svg
              className="transition-transform group-hover:translate-x-0.5"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a
            href="https://github.com/zilin"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-50"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
          <div className="ml-2 hidden items-center gap-5 border-l border-neutral-800 pl-5 sm:flex">
            {[
              { label: "Demos", value: String(demoCount) },
              { label: "Stack", value: "Next · shadcn" },
              { label: "License", value: "MIT" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-neutral-600">
                  {stat.label}
                </span>
                <span
                  className="text-sm font-medium text-neutral-300"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
