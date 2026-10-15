"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { PanelLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENTS } from "./data";
import { AgentView } from "./agent-view";
import { ChatView } from "./chat-view";
import { IconButton } from "./parts";
import { Sidebar, type Theme } from "./sidebar";
import { abFontClass } from "./fonts";
import { useDismiss } from "./use-dismiss";
import "./agent-builder.css";

const DEFAULT_PATH = "/agents/product-discovery";

/* 页面内用 hash 路由，和原站一致（#/chat、#/agents/product-discovery），不占用 Next 路由 */
function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
const getHash = () => location.hash.replace(/^#/, "") || DEFAULT_PATH;
function usePath() {
  const path = useSyncExternalStore(subscribe, getHash, () => DEFAULT_PATH);
  const navigate = useCallback((p: string) => {
    location.hash = p;
  }, []);
  return [path, navigate] as const;
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex h-[38px] items-center border-b border-ab-line px-3.5 pt-0.5 text-[12.5px] text-ab-fg capitalize">{title}</header>
      <div className="flex flex-1 items-center justify-center text-[13px] text-ab-faint">Nothing here yet — this page isn&rsquo;t part of the demo.</div>
    </div>
  );
}

const PAGES = ["Chat", "Inbox", "Templates", "Integrations", "Skills", "Usage", "Settings"];

function CommandSearch({ onClose, onNavigate }: { onClose: () => void; onNavigate: (p: string) => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const ref = useDismiss<HTMLDivElement>(true, onClose);
  const items = [
    ...AGENTS.map((a) => ({ label: a.name, hint: "Agent", path: `/agents/${a.slug}` })),
    ...PAGES.map((p) => ({ label: p, hint: "Page", path: `/${p.toLowerCase()}` })),
  ].filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));
  const go = (p: string) => {
    onNavigate(p);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[14vh]">
      <div ref={ref} role="dialog" aria-label="Search" className="ab-pop w-[min(480px,92vw)] overflow-hidden rounded-2xl border border-ab-line2 bg-ab-bg shadow-2xl">
        <div className="flex items-center gap-2 border-b border-ab-line px-3.5">
          <Search className="size-3.5 text-ab-mute" />
          <input
            autoFocus
            value={q}
            placeholder="Search agents and pages…"
            aria-label="Search"
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                if (items.length) setIdx((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length);
              }
              if (e.key === "Enter" && items[idx]) go(items[idx].path);
            }}
            className="h-11 flex-1 bg-transparent text-[13px] text-ab-fg outline-none placeholder:text-ab-faint"
          />
        </div>
        <ul className="max-h-72 overflow-y-auto p-1.5">
          {items.length === 0 && <li className="px-3 py-6 text-center text-[12px] text-ab-faint">No results</li>}
          {items.map((i, n) => (
            <li key={i.path}>
              <button
                type="button"
                onMouseEnter={() => setIdx(n)}
                onClick={() => go(i.path)}
                className={cn("flex h-8 w-full items-center rounded-lg px-2.5 text-left text-[13px] text-ab-fg", n === idx && "bg-ab-hover")}
              >
                {i.label}
                <span className="ml-auto text-[11px] text-ab-faint">{i.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AgentBuilderDemo() {
  const [path, navigate] = usePath();
  const [theme, setTheme] = useState<Theme>("dark");
  const [sysDark, setSysDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSysDark(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const resolved = theme === "system" ? (sysDark ? "dark" : "light") : theme;
  const agent = AGENTS.find((a) => path === `/agents/${a.slug}`);
  const toggle = sidebarOpen ? null : (
    <IconButton aria-label="Open sidebar" onClick={() => setSidebarOpen(true)} className="size-6">
      <PanelLeft className="size-3.5" />
    </IconButton>
  );

  let view: React.ReactNode;
  if (path === "/chat") view = <ChatView />;
  else if (agent) view = <AgentView key={agent.slug} agent={agent} onBack={() => navigate("/agents")} sidebarToggle={toggle} />;
  else view = <Placeholder title={path.split("/").filter(Boolean).join(" / ")} />;

  return (
    <div
      data-theme={resolved}
      className={cn("ab-root fixed inset-0 flex overflow-hidden bg-ab-bg text-ab-fg", abFontClass)}
      style={{ fontFamily: "var(--font-ab), ui-sans-serif, system-ui, sans-serif" }}
    >
      {sidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-40 md:static md:z-auto">
          <Sidebar
            path={path}
            onNavigate={(p) => {
              navigate(p);
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            onCollapse={() => setSidebarOpen(false)}
            onSearch={() => setSearchOpen(true)}
            theme={theme}
            onTheme={setTheme}
          />
        </div>
      )}
      {view}
      {path === "/chat" && !sidebarOpen && <div className="fixed top-2.5 left-3">{toggle}</div>}
      {searchOpen && <CommandSearch onClose={() => setSearchOpen(false)} onNavigate={navigate} />}
    </div>
  );
}
