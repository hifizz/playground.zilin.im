"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Check, ChevronRight, GraduationCap, Loader, Play, ScrollText, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { RUN_TEXT, SKILLS, SUB_AGENTS, TOOLS, type Agent } from "./data";
import { Canvas } from "./canvas";
import { AppChip, DotsGrid } from "./icons";
import { Composer, IconButton, TokenBanner } from "./parts";

/* 一次「运行」完全由 elapsed 推导：先流式输出文字，再逐个读取 tools，最后展示分组 */
const CHAR_MS = 8;
const TEXT_END = RUN_TEXT.length * CHAR_MS;
const TOOL_MS = 520;
const TOOLS_END = TEXT_END + 400 + TOOLS.length * TOOL_MS;
const RUN_END = TOOLS_END + 900;
const TIME_SCALE = 18; // 把几秒的演示换算成「分钟级」的运行时长

function useRun() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const start = performance.now() - elapsed;
    const id = setInterval(() => {
      const t = performance.now() - start;
      if (t >= RUN_END) {
        setElapsed(RUN_END);
        setRunning(false);
      } else setElapsed(t);
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- elapsed 仅用于恢复起点，不应重启计时器
  }, [running]);

  const toggle = useCallback(() => {
    setRunning((r) => {
      if (!r && elapsed >= RUN_END) setElapsed(0);
      return !r;
    });
  }, [elapsed]);

  return { elapsed, running, toggle, done: elapsed >= RUN_END };
}

function Group({ title, count, unit, items, icon }: { title: string; count: number; unit: string; items: string[]; icon: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-ab-line first:border-t-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-[27px] w-full items-center gap-2 px-2.5 text-left text-[11.5px] text-ab-fg"
      >
        <ChevronRight className={cn("size-3 text-ab-mute transition-transform duration-200", open && "rotate-90")} />
        {title}
        <span className="text-ab-faint">
          · {count} {unit}
        </span>
      </button>
      <div className={cn("grid transition-[grid-template-rows] duration-300 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <ul className="min-h-0 overflow-hidden">
          {items.map((n) => (
            <li key={n} className="flex h-[33px] items-center gap-2.5 pl-[30px] text-[11.5px] text-ab-fg/90">
              <span className="inline-flex size-[18px] items-center justify-center rounded-md border border-ab-line2 text-ab-mute [&>svg]:size-2.5">{icon}</span>
              {n}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RunPanel({ run, bannerOpen, onBanner }: { run: ReturnType<typeof useRun>; bannerOpen: boolean; onBanner: () => void }) {
  const { elapsed, running, done } = run;
  const [followUp, setFollowUp] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  const chars = Math.min(RUN_TEXT.length, Math.floor(elapsed / CHAR_MS));
  const toolsShown = Math.max(0, Math.min(TOOLS.length, Math.floor((elapsed - TEXT_END - 400) / TOOL_MS) + 1));
  const toolsDone = Math.max(0, Math.min(TOOLS.length, Math.floor((elapsed - TEXT_END - 400) / TOOL_MS)));
  const showGroups = elapsed >= TOOLS_END;
  const secs = Math.floor((elapsed * TIME_SCALE) / 1000);
  const tokens = ((elapsed * TIME_SCALE) / 1000) * 0.034;

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [toolsShown, showGroups, sent.length]);

  return (
    <section aria-label="Run" className="flex h-full w-full min-w-0 flex-col lg:w-[306px] lg:shrink-0">
      <div className="mx-0 flex h-[40px] shrink-0 items-center gap-1.5 rounded-xl border border-ab-line2 bg-ab-bg pr-1.5 pl-2.5 text-[12px] text-ab-fg">
        Run
        <span className="inline-flex h-[18px] shrink-0 items-center gap-1 rounded-md border border-ab-new-line whitespace-nowrap bg-ab-new-bg px-1.5 text-[11.5px] text-ab-accent">
          <svg viewBox="0 0 16 16" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden>
            <path d="M9 1.5 3.5 9H8l-1 5.500L12.500 7H8z" />
          </svg>
          discovery-agent
        </span>
        <span className="min-w-0 truncate">over the past 7 days</span>
        <button
          type="button"
          aria-label={running ? "Stop run" : "Run again"}
          onClick={run.toggle}
          className="ml-auto inline-flex size-[22px] shrink-0 items-center justify-center rounded-md bg-ab-fg text-ab-bg transition-opacity hover:opacity-85"
        >
          {running ? <Square className="size-2.5 fill-current" /> : <Play className="size-2.5 fill-current" />}
        </button>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-2.5 pt-3.5 pb-4">
        <p className="min-h-[1px] text-[11.5px] leading-[18px] whitespace-pre-wrap text-ab-mute" aria-live="polite">
          {RUN_TEXT.slice(0, chars)}
          {chars < RUN_TEXT.length && running && <span className="ml-px inline-block h-3 w-px translate-y-0.5 animate-pulse bg-ab-fg" />}
        </p>

        {toolsShown > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 text-[11.5px] text-ab-fg">
              <span className="inline-flex size-[18px] items-center justify-center rounded-md border border-ab-line2 text-ab-mute">
                <BookOpen className="size-2.5" />
              </span>
              Read tools
            </div>
            <ol>
              {TOOLS.slice(0, toolsShown).map((t, i) => {
                const finished = i < toolsDone;
                return (
                  <li key={t.name} className="ab-pop">
                    <span className="ml-[8.5px] block h-[7px] w-px bg-ab-line2" />
                    <div className="flex h-[22px] items-center gap-2 text-[11.5px] text-ab-fg/90">
                      <span className="flex w-[18px] justify-center text-ab-faint">
                        {finished ? <Check className="size-3" /> : <Loader className="size-3 animate-spin" />}
                      </span>
                      <AppChip app={t.app} size={16} className="rounded-[5px]" />
                      <span className="truncate">{t.name}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {showGroups && (
          <div className="ab-pop mt-4 overflow-hidden rounded-xl border border-ab-line2">
            <Group title="Sub-agents" count={SUB_AGENTS.length} unit="agents" items={SUB_AGENTS} icon={<ScrollText />} />
            <Group title="Skills" count={SKILLS.length} unit="skills" items={SKILLS} icon={<GraduationCap />} />
          </div>
        )}

        {sent.map((s, i) => (
          <div key={i} className="ab-pop mt-4 ml-auto w-fit max-w-full rounded-xl bg-ab-sel px-3 py-1.5 text-[11.5px] text-ab-fg">
            {s}
          </div>
        ))}

        {elapsed > 0 && (
          <div className="mt-5 flex items-center gap-2 text-[11.5px] text-ab-mute">
            <DotsGrid active={running} className="text-ab-mute" />
            <span className={cn("text-ab-fg/90", running && "animate-pulse")}>{done ? "Thought" : "Thinking"}</span>
            <span className="tabular-nums">
              {Math.floor(secs / 60)}m {secs % 60}s · {tokens.toFixed(1)}k tokens
            </span>
          </div>
        )}
      </div>

      <div className="shrink-0">
        {bannerOpen && <TokenBanner onClose={onBanner} />}
        <Composer
          value={followUp}
          onChange={setFollowUp}
          onSubmit={(t) => {
            if (t) setSent((s) => [...s, t]);
            setFollowUp("");
          }}
          placeholder="Add a follow-up"
          attached={bannerOpen}
        />
      </div>
    </section>
  );
}

export function AgentView({ agent, onBack, sidebarToggle }: { agent: Agent; onBack: () => void; sidebarToggle: React.ReactNode }) {
  const run = useRun();
  const [panelOpen, setPanelOpen] = useState(true);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [shared, setShared] = useState(false);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex h-[38px] shrink-0 items-center justify-between border-b border-ab-line px-3 pt-0.5 text-[12.5px]">
        <div className="flex min-w-0 items-center gap-2">
          {sidebarToggle}
          <IconButton aria-label="Back to agents" onClick={onBack} className="size-6">
            <ArrowLeft className="size-3.5" />
          </IconButton>
          <span className="text-ab-mute">Agents</span>
          <span className="text-ab-faint">/</span>
          <span className="truncate text-ab-fg">{agent.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(location.href).catch(() => {});
              setShared(true);
              setTimeout(() => setShared(false), 1500);
            }}
            className="h-6 rounded-md border border-ab-line2 px-2 text-[12px] text-ab-fg hover:bg-ab-hover"
          >
            {shared ? "Link copied" : "Share"}
          </button>
          <button type="button" disabled className="h-6 rounded-md border border-ab-line px-2 text-[12px] text-ab-faint">
            Save agent
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-2.5 p-2.5">
        {panelOpen && <RunPanel run={run} bannerOpen={bannerOpen} onBanner={() => setBannerOpen(false)} />}
        <div className={cn("min-w-0 flex-1", panelOpen ? "hidden lg:block" : "block")}>
          <Canvas agent={agent} running={run.running} panelOpen={panelOpen} onTogglePanel={() => setPanelOpen((o) => !o)} />
        </div>
      </div>
    </div>
  );
}
