"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, Clock, GraduationCap, Minus, PanelLeft, Plus, ScrollText, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { INSTRUCTIONS, MEMORIES, SKILLS, SUB_AGENTS, TOOLS, type Agent } from "./data";
import { AppChip } from "./icons";
import { IconButton } from "./parts";

/* ============================== 节点外壳 ============================== */

type Tone = "default" | "new";
type Side = "l" | "r";

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex size-[22px] shrink-0 items-center justify-center rounded-md border border-ab-line bg-ab-raised text-ab-mute">
      {children}
    </span>
  );
}

function Row({ icon, children, className }: { icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-10 items-center gap-2 border-t border-ab-line px-2.5 py-1.5 first:border-t-0", className)}>
      {icon}
      <span className="min-w-0 flex-1 truncate text-[12px] text-ab-fg/90">{children}</span>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("overflow-hidden rounded-xl border border-ab-line bg-ab-bg", className)}>{children}</div>;
}

function Collapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-out", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function Badge({ tone, children }: { tone: "new" | "warn"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] items-center gap-1 rounded-md border px-1.5 text-[11px] leading-none",
        tone === "new" ? "border-ab-new-line bg-ab-new-bg text-ab-accent" : "border-ab-warn/50 bg-ab-warn/10 text-ab-warn",
      )}
    >
      {children}
    </span>
  );
}

function SectionHeader({ title, badge, open, onToggle }: { title: string; badge?: React.ReactNode; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      data-nodrag
      aria-expanded={open}
      onClick={onToggle}
      className="flex h-[30px] w-full items-center gap-1.5 rounded-md px-2 text-left text-[12px] text-ab-fg/90 hover:text-ab-fg"
    >
      <ChevronDown className={cn("size-3 text-ab-mute transition-transform duration-200", !open && "-rotate-90")} />
      {title}
      {badge}
    </button>
  );
}

function Handle({ id, side, color }: { id: string; side: Side; color: string }) {
  return (
    <span
      data-h={`${id}:${side}`}
      className={cn("pointer-events-none absolute top-1/2 size-[5px] -translate-y-1/2 rounded-full", side === "r" ? "-right-[9px]" : "-left-[9px]")}
      style={{ background: color }}
    />
  );
}

function Node({
  id,
  title,
  badge,
  tone = "default",
  sides,
  handleColor = "var(--ab-faint)",
  className,
  children,
  loading,
  defaultOpen = true,
}: {
  id: string;
  title: string;
  badge?: React.ReactNode;
  tone?: Tone;
  sides: Side[];
  handleColor?: string;
  className?: string;
  children: (open: boolean) => React.ReactNode;
  loading?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div data-node className={cn("relative w-[230px]", className)}>
      {sides.map((s) => (
        <Handle key={s} id={id} side={s} color={handleColor} />
      ))}
      {loading ? (
        <div className="relative flex h-[34px] items-center gap-2 overflow-hidden rounded-full border border-ab-new-line/60 bg-ab-new-bg px-3 text-[12px] text-ab-fg/90">
          <span className="size-3 animate-[ab-spin_0.9s_linear_infinite] rounded-full border-[1.5px] border-ab-mute border-t-transparent" />
          {title}
          <span className="pointer-events-none absolute inset-y-0 w-1/2 animate-[ab-shimmer_1.4s_ease-in-out_infinite] bg-linear-to-r from-transparent via-ab-accent/20 to-transparent blur-sm" />
        </div>
      ) : (
        <div
          className={cn(
            "ab-pop rounded-[18px] border p-[3px] pb-[5px]",
            tone === "new" ? "border-dashed border-ab-new-line bg-ab-new-bg" : "border-ab-line bg-ab-panel",
          )}
        >
          <SectionHeader title={title} badge={badge} open={open} onToggle={() => setOpen((o) => !o)} />
          <Collapse open={open}>
            <div className="px-[3px]">{children(open)}</div>
          </Collapse>
        </div>
      )}
    </div>
  );
}

/* ============================== 各节点 ============================== */

function ScheduleNode() {
  const clock = (
    <Chip>
      <Clock className="size-3" />
    </Chip>
  );
  return (
    <Node id="schedule" title="Schedule" sides={["r"]} handleColor="var(--ab-faint)">
      {() => (
        <Card>
          <Row icon={clock}>
            Mon 08:00 AM <span className="px-1 text-ab-faint">·</span> weekly
          </Row>
          <Row icon={clock}>
            cron 0 8 * * 1 <span className="px-1 text-ab-faint">·</span> CEST
          </Row>
        </Card>
      )}
    </Node>
  );
}

function TriggersNode() {
  return (
    <Node id="triggers" title="Triggers" badge={<Badge tone="new">New</Badge>} tone="new" sides={["r"]} handleColor="#3b8cff">
      {() => (
        <Card>
          <Row icon={<AppChip app="zendesk" />}>Zendesk webhook</Row>
          <Row className="gap-1 text-[12px]">
            <span className="flex items-center gap-1.5">
              tag=enterprise <span className="rounded-md border border-ab-line2 px-1 text-[11px] leading-[18px] text-ab-mute">AND</span> urgent
            </span>
          </Row>
        </Card>
      )}
    </Node>
  );
}

function ChannelsNode() {
  return (
    <Node id="channels" title="Channels" badge={<Badge tone="warn"><TriangleAlert className="size-3" />Set identity</Badge>} sides={["r"]} handleColor="#d9822b">
      {() => (
        <Card>
          <div className="px-2.5 py-2 text-[12px] leading-[18px] text-ab-fg/80">Set an agent identity to configure channels</div>
        </Card>
      )}
    </Node>
  );
}

function MemoryNode() {
  return (
    <Node id="memory" title="Memory" badge={<Badge tone="new">New</Badge>} tone="new" sides={["r"]} handleColor="#3b8cff">
      {() => (
        <Card>
          {MEMORIES.map((m) => (
            <Row
              key={m}
              icon={
                <Chip>
                  <BookOpen className="size-3" />
                </Chip>
              }
            >
              {m}
            </Row>
          ))}
        </Card>
      )}
    </Node>
  );
}

function AgentNode({ agent }: { agent: Agent }) {
  const [instrOpen, setInstrOpen] = useState(true);
  return (
    <Node id="agent" title="Agent" sides={["l", "r"]} handleColor="var(--ab-faint)">
      {() => (
        <>
          <Card className="px-2.5 py-2">
            <div className="text-[12px] font-medium text-ab-fg">{agent.name} Agent</div>
            <div className="text-[12px] leading-[18px] text-ab-mute">{agent.tagline}</div>
          </Card>
          <SectionHeader title="Instructions" open={instrOpen} onToggle={() => setInstrOpen((o) => !o)} />
          <Collapse open={instrOpen}>
            <Card className="relative">
              <div
                data-nodrag
                data-scroll
                tabIndex={0}
                aria-label="Instructions"
                className="h-[118px] overflow-y-auto px-2.5 py-2 pr-3 [mask-image:linear-gradient(to_bottom,#000_82%,transparent)]"
              >
                <div className="text-[12px] font-medium text-ab-fg">{agent.name} Agent</div>
                <p className="text-[12px] leading-[18px] text-ab-mute">{INSTRUCTIONS}</p>
              </div>
            </Card>
          </Collapse>
        </>
      )}
    </Node>
  );
}

function ToolsNode({ loading }: { loading: boolean }) {
  const [all, setAll] = useState(false);
  const shown = all ? TOOLS : TOOLS.slice(0, 4);
  const rest = TOOLS.slice(4);
  return (
    <Node id="tools" title="Tools" sides={["l"]} loading={loading}>
      {() => (
        <Card>
          {shown.map((t) => (
            <Row key={t.name} icon={<AppChip app={t.app} />}>
              {t.name.replace(" #customer-feedback", "")}
            </Row>
          ))}
          <button
            type="button"
            data-nodrag
            onClick={() => setAll((a) => !a)}
            className="flex min-h-10 w-full items-center gap-2 border-t border-ab-line px-2.5 text-left text-[12px] text-ab-fg/90 hover:bg-ab-hover"
          >
            <span className="flex">
              {rest.map((t, i) => (
                <AppChip key={t.app} app={t.app} className={cn(i > 0 && "-ml-1.5")} />
              ))}
            </span>
            {all ? "Show less" : `Show ${rest.length} more`}
          </button>
        </Card>
      )}
    </Node>
  );
}

function ListNode({ id, title, items, icon, loading }: { id: string; title: string; items: string[]; icon: React.ReactNode; loading: boolean }) {
  return (
    <Node id={id} title={title} sides={["l"]} loading={loading}>
      {() => (
        <Card>
          {items.map((n) => (
            <Row key={n} icon={<Chip>{icon}</Chip>}>
              {n}
            </Row>
          ))}
        </Card>
      )}
    </Node>
  );
}

/* ============================== 连线 ============================== */

const EDGES: { from: string; fromSide: Side; to: string; toSide: Side; color: string }[] = [
  { from: "schedule", fromSide: "r", to: "agent", toSide: "l", color: "var(--ab-faint)" },
  { from: "triggers", fromSide: "r", to: "agent", toSide: "l", color: "#3b8cff" },
  { from: "channels", fromSide: "r", to: "agent", toSide: "l", color: "#d9822b" },
  { from: "memory", fromSide: "r", to: "agent", toSide: "l", color: "#3b8cff" },
  { from: "agent", fromSide: "r", to: "tools", toSide: "l", color: "var(--ab-faint)" },
  { from: "agent", fromSide: "r", to: "subagents", toSide: "l", color: "var(--ab-faint)" },
  { from: "agent", fromSide: "r", to: "skills", toSide: "l", color: "var(--ab-faint)" },
];

function Edges({ graph, viewK, running }: { graph: React.RefObject<HTMLDivElement | null>; viewK: React.RefObject<number>; running: boolean }) {
  const [paths, setPaths] = useState<{ d: string; color: string }[]>([]);

  // 节点尺寸变化（折叠 / 加载完成）时重新测量连接点；ResizeObserver 挂载时会先触发一次
  useEffect(() => {
    const g = graph.current;
    if (!g) return;
    const measure = () => {
      const gr = g.getBoundingClientRect();
      const k = viewK.current || 1;
      const pt = (key: string) => {
        const el = g.querySelector(`[data-h="${key}"]`);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: (r.left + r.width / 2 - gr.left) / k, y: (r.top + r.height / 2 - gr.top) / k };
      };
      const next = EDGES.flatMap((e) => {
        const a = pt(`${e.from}:${e.fromSide}`);
        const b = pt(`${e.to}:${e.toSide}`);
        if (!a || !b) return [];
        const dx = Math.max(40, (b.x - a.x) * 0.5);
        return [{ d: `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`, color: e.color }];
      });
      setPaths((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    const ro = new ResizeObserver(measure);
    g.querySelectorAll("[data-node]").forEach((n) => ro.observe(n));
    return () => ro.disconnect();
  }, [graph, viewK]);

  return (
    <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width="1" height="1" aria-hidden>
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke={p.color}
          strokeWidth="1"
          strokeDasharray="2 3"
          strokeLinecap="round"
          opacity={0.75}
          className={running && p.color !== "var(--ab-faint)" ? "ab-flow" : undefined}
        />
      ))}
    </svg>
  );
}

/* ============================== 画布 ============================== */

const GRAPH_W = 914;
const GRAPH_H = 560;
const MIN_K = 0.3;
const MAX_K = 2;

export function Canvas({ agent, running, panelOpen, onTogglePanel }: { agent: Agent; running: boolean; panelOpen: boolean; onTogglePanel: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const graph = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const viewK = useRef(1);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState({ tools: false, subagents: false, skills: false });

  useEffect(() => {
    viewK.current = view.k;
  }, [view.k]);

  const center = useCallback(() => {
    const el = wrap.current;
    if (!el) return;
    setView({ k: 1, x: (el.clientWidth - GRAPH_W) / 2, y: Math.max(24, (el.clientHeight - GRAPH_H) / 2) });
  }, []);

  useLayoutEffect(center, [center, panelOpen]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setLoaded((l) => ({ ...l, tools: true })), 900),
      setTimeout(() => setLoaded((l) => ({ ...l, subagents: true })), 1300),
      setTimeout(() => setLoaded((l) => ({ ...l, skills: true })), 1700),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const zoomAt = useCallback((factor: number, px?: number, py?: number) => {
    const el = wrap.current;
    if (!el) return;
    const cx = px ?? el.clientWidth / 2;
    const cy = py ?? el.clientHeight / 2;
    setView((v) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, +(v.k * factor).toFixed(3)));
      const r = k / v.k;
      return { k, x: cx - (cx - v.x) * r, y: cy - (cy - v.y) * r };
    });
  }, []);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const inScroll = (e.target as HTMLElement).closest("[data-scroll]");
      if (inScroll && !e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const step = (dir: 1 | -1) => zoomAt(dir > 0 ? 1.1 : 1 / 1.1);

  return (
    <div
      ref={wrap}
      className={cn("relative h-full min-w-0 flex-1 touch-none overflow-hidden rounded-xl border border-ab-line bg-ab-bg select-none", dragging ? "cursor-grabbing" : "cursor-grab")}
      style={{
        backgroundImage: "radial-gradient(circle, var(--ab-dot) 1px, transparent 1.2px)",
        backgroundSize: `${22 * view.k}px ${22 * view.k}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("[data-nodrag],button")) return;
        drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        drag.current = { ...d, x: e.clientX, y: e.clientY };
        setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      }}
      onPointerUp={() => {
        drag.current = null;
        setDragging(false);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
      }}
    >
      <div className="absolute top-3 left-3 z-20 hidden lg:block">
        <IconButton
          aria-label={panelOpen ? "Hide run panel" : "Show run panel"}
          aria-pressed={panelOpen}
          onClick={onTogglePanel}
          className="size-[30px] rounded-lg border border-ab-line2 bg-ab-panel"
        >
          <PanelLeft className="size-3.5" />
        </IconButton>
      </div>

      <div ref={graph} className="absolute top-0 left-0 origin-top-left" style={{ width: GRAPH_W, transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
        <Edges graph={graph} viewK={viewK} running={running} />
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-3.5">
            <ScheduleNode />
            <TriggersNode />
            <ChannelsNode />
            <MemoryNode />
          </div>
          <AgentNode agent={agent} />
          <div className="flex flex-col gap-3.5">
            <ToolsNode loading={!loaded.tools} />
            <ListNode id="subagents" title="Sub-agents" items={SUB_AGENTS} loading={!loaded.subagents} icon={<ScrollText className="size-3" />} />
            <ListNode id="skills" title="Skills" items={SKILLS} loading={!loaded.skills} icon={<GraduationCap className="size-3" />} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 z-20 flex h-9 -translate-x-1/2 items-center rounded-xl border border-ab-line2 bg-ab-panel px-1 text-[12px] text-ab-fg">
        <IconButton aria-label="Zoom in" onClick={() => step(1)} className="size-7">
          <Plus className="size-3.5" />
        </IconButton>
        <button type="button" aria-label="Reset zoom" onClick={center} className="min-w-12 rounded-md px-1.5 py-1 text-center tabular-nums hover:bg-ab-hover">
          {Math.round(view.k * 100)}%
        </button>
        <IconButton aria-label="Zoom out" onClick={() => step(-1)} className="size-7">
          <Minus className="size-3.5" />
        </IconButton>
      </div>
    </div>
  );
}
