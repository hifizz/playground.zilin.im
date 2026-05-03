export function Hero({ demoCount }: { demoCount: number }) {
  return (
    <section
      className="relative overflow-hidden px-6 py-20 sm:px-10 sm:py-28"
      style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(99,102,241,0.07) 0%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-5xl">
        <p className="mb-5 font-mono text-[11px] tracking-[0.18em] uppercase text-neutral-500">
          playground.zilin.im
        </p>
        <h1 className="mb-3 text-5xl font-bold tracking-tight text-neutral-50 sm:text-7xl">
          Playground
        </h1>
        <p className="mb-1 text-lg text-neutral-300 sm:text-xl">
          AI 时代的 UI/UX 实验室
        </p>
        <p className="mb-8 max-w-md text-sm leading-relaxed text-neutral-500">
          研究 UI Agent 所需的各种交互效果，以 shadcn/ui 可安装形式维护与分发。
        </p>
        <div className="flex flex-wrap gap-2">
          {[`${demoCount} Demos`, "Framer Motion", "shadcn/ui"].map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 px-3 py-1 font-mono text-[11px] text-neutral-500"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
