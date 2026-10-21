import { Hero } from "./hero";
import { DemosGrid } from "./demos-grid";
import { demos } from "./demos";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50 font-sans">
      <Hero demoCount={demos.length} />
      <section className="px-6 pb-4 sm:px-10">
        <a
          href="/claude-style-lab"
          className="group grid overflow-hidden border border-[#788c5d]/55 bg-[#141413] transition-colors hover:border-[#d97757] md:grid-cols-[1fr_18rem]"
        >
          <div className="px-6 py-7 sm:px-8 sm:py-9">
            <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#d97757] uppercase">
              New research set · 8 pages
            </span>
            <h2 className="mt-4 font-serif text-3xl font-normal tracking-[-0.035em] text-[#faf9f5] sm:text-4xl">
              Claude HTML Style Lab
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#b0aea5]">
              同一份 Brief 对照七个 Claude / Anthropic 相关 Skill，再用官方 Dark、Light、Gray、Orange、Blue 与 Green Token 收敛为一个仓库级复刻 Skill。
            </p>
          </div>
          <div className="relative hidden border-l border-[#e8e6dc]/35 bg-[#faf9f5] md:block" aria-hidden="true">
            <span className="absolute top-7 left-7 font-mono text-[10px] tracking-[0.16em] text-[#141413]/60">01—08</span>
            <i className="absolute top-[38%] right-8 left-8 border-t-[18px] border-[#141413]" />
            <i className="absolute right-8 bottom-[28%] left-8 border-t border-[#788c5d]" />
            <span className="absolute right-7 bottom-7 text-xl text-[#141413] transition-transform group-hover:translate-x-1">→</span>
          </div>
        </a>
      </section>
      <DemosGrid />
      <footer className="border-t border-neutral-700/50 px-6 py-5 sm:px-10">
        <p className="text-xs text-neutral-600">zilin · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
