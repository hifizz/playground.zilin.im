"use client";

import { useCallback, useState } from "react";
import {
  BarChart3,
  Building2,
  ChevronRight,
  ChevronsUpDown,
  Contrast,
  Inbox,
  Layers,
  LifeBuoy,
  LogOut,
  Megaphone,
  MessageCircle,
  Monitor,
  Moon,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Sun,
  UserRound,
  Blocks,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENTS, type AppId } from "./data";
import { AppGlyph, StudioLogo } from "./icons";
import { IconButton, Kbd } from "./parts";
import { useDismiss } from "./use-dismiss";

export type Theme = "dark" | "light" | "system";

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-[30px] w-full items-center gap-2 rounded-lg px-2 text-left text-[12.5px] transition-colors",
        active ? "bg-ab-sel text-ab-fg" : "text-ab-mute hover:bg-ab-hover hover:text-ab-fg",
      )}
    >
      <span className="flex size-3.5 items-center justify-center [&>svg]:size-3.5">{icon}</span>
      {label}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 my-1.5 h-px bg-ab-line" />;
}

function WorkspaceMenu({ theme, onTheme, onNavigate }: { theme: Theme; onTheme: (t: Theme) => void; onNavigate: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"agents" | "workbench">("agents");
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);
  const item = "flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] text-ab-mute hover:bg-ab-hover hover:text-ab-fg";
  const themes: [Theme, React.ReactNode, string][] = [
    ["light", <Sun key="s" className="size-3.5" />, "Light"],
    ["dark", <Moon key="m" className="size-3.5" />, "Dark"],
    ["system", <Monitor key="d" className="size-3.5" />, "System"],
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 min-w-0 items-center gap-2 rounded-lg px-1 pr-1.5 text-[13px] text-ab-fg hover:bg-ab-hover"
      >
        <StudioLogo size={22} />
        <span className="truncate">Outglow Studio</span>
        <ChevronsUpDown className="size-3 shrink-0 text-ab-mute" />
      </button>

      {open && (
        <div role="menu" className="ab-pop absolute top-full left-0 z-40 mt-1.5 w-[250px] rounded-2xl border border-ab-line2 bg-ab-bg p-1.5 shadow-2xl">
          <div role="tablist" className="mb-1 grid grid-cols-2 rounded-xl bg-ab-panel p-0.5">
            {(["agents", "workbench"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "h-7 rounded-[10px] text-[13px] capitalize transition-colors",
                  tab === t ? "border border-ab-line2 bg-ab-bg text-ab-fg" : "border border-transparent text-ab-mute hover:text-ab-fg",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <button role="menuitem" type="button" className={item} onClick={close}>
            <Building2 className="size-3.5" />
            Organization settings
            <ChevronRight className="ml-auto size-3.5" />
          </button>
          <Divider />
          <button role="menuitem" type="button" className={item} onClick={close}>
            <UserRound className="size-3.5" />
            Profile settings
            <ChevronRight className="ml-auto size-3.5" />
          </button>
          <div className="flex h-9 items-center gap-2.5 px-2.5 text-[13px] text-ab-mute">
            <Contrast className="size-3.5" />
            Appearance
            <div role="radiogroup" aria-label="Appearance" className="ml-auto flex rounded-full bg-ab-panel p-0.5">
              {themes.map(([id, icon, label]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={theme === id}
                  aria-label={label}
                  onClick={() => onTheme(id)}
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full transition-colors",
                    theme === id ? "border border-ab-line2 bg-ab-bg text-ab-fg" : "border border-transparent text-ab-mute hover:text-ab-fg",
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <Divider />
          <button role="menuitem" type="button" className={item} onClick={close}>
            <LifeBuoy className="size-3.5" />
            Support
          </button>
          <button role="menuitem" type="button" className={item} onClick={close}>
            <Megaphone className="size-3.5" />
            What&rsquo;s new
          </button>
          <Divider />
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={() => {
              close();
              onNavigate("/chat");
            }}
          >
            <LogOut className="size-3.5" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

const CONNECT: AppId[] = ["gmail", "gdrive", "slack", "linear", "gitlab", "github", "fable", "openai"];

export function Sidebar({
  path,
  onNavigate,
  onCollapse,
  onSearch,
  theme,
  onTheme,
}: {
  path: string;
  onNavigate: (p: string) => void;
  onCollapse: () => void;
  onSearch: () => void;
  theme: Theme;
  onTheme: (t: Theme) => void;
}) {
  const nav = (p: string) => () => onNavigate(p);
  return (
    <aside aria-label="Sidebar" className="flex h-full w-[236px] shrink-0 flex-col border-r border-ab-line bg-ab-bg">
      <div className="flex h-[38px] items-center justify-between px-3 pt-2.5">
        <WorkspaceMenu theme={theme} onTheme={onTheme} onNavigate={onNavigate} />
        <IconButton aria-label="Collapse sidebar" onClick={onCollapse} className="size-6">
          <PanelLeft className="size-3.5" />
        </IconButton>
      </div>

      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={onSearch}
          className="flex h-[30px] w-full items-center gap-2 rounded-lg border border-ab-line bg-ab-panel/60 px-2 text-[12.5px] text-ab-mute hover:border-ab-line2"
        >
          <Search className="size-3.5" />
          Search...
          <span className="ml-auto flex gap-0.5">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-2" aria-label="Primary">
        <NavItem icon={<MessageCircle />} label="Chat" active={path === "/chat"} onClick={nav("/chat")} />
        <NavItem icon={<Inbox />} label="Inbox" active={path === "/inbox"} onClick={nav("/inbox")} />
        <Divider />
        <NavItem icon={<Layers />} label="Templates" active={path === "/templates"} onClick={nav("/templates")} />
        <NavItem icon={<Blocks />} label="Integrations" active={path === "/integrations"} onClick={nav("/integrations")} />
        <NavItem icon={<GraduationCap />} label="Skills" active={path === "/skills"} onClick={nav("/skills")} />
        <Divider />

        <div className="flex h-7 items-center justify-between px-2 text-[11.5px] text-ab-faint">
          Agents
          <IconButton aria-label="New agent" className="size-5" onClick={nav("/agents")}>
            <Plus className="size-3.5" />
          </IconButton>
        </div>
        {AGENTS.map((a) => {
          const active = path === `/agents/${a.slug}`;
          return (
            <button
              key={a.slug}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={nav(`/agents/${a.slug}`)}
              className={cn(
                "flex h-[30px] w-full items-center gap-2.5 rounded-lg px-2 text-left text-[12.5px] transition-colors",
                active ? "bg-ab-sel text-ab-fg" : "text-ab-mute hover:bg-ab-hover hover:text-ab-fg",
              )}
            >
              <span className={cn("ml-[3px] size-[5px] shrink-0 rounded-full", active ? "bg-ab-mute" : "border border-ab-faint")} />
              <span className="truncate">{a.name}</span>
            </button>
          );
        })}
        <NavItem icon={<Plus />} label="More agents" active={path === "/agents"} onClick={nav("/agents")} />

        <div className="mt-auto pt-2">
          <NavItem icon={<BarChart3 />} label="Usage" active={path === "/usage"} onClick={nav("/usage")} />
          <NavItem icon={<Settings />} label="Settings" active={path === "/settings"} onClick={nav("/settings")} />
        </div>
      </nav>

      <div className="mt-2 bg-linear-to-b from-ab-panel to-ab-new-bg px-3.5 pt-3.5 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-medium text-ab-fg">Connect more apps</span>
          <IconButton aria-label="Connect an app" className="size-[22px] rounded-md border border-ab-line2" onClick={nav("/integrations")}>
            <Plus className="size-3.5" />
          </IconButton>
        </div>
        <p className="mt-1 text-[11.5px] leading-4 text-ab-mute">More sources in, better answers out.</p>
        <div className="mt-2.5 flex gap-1.5">
          {CONNECT.map((a) => (
            <span key={a} className="inline-flex size-3.5 items-center justify-center text-ab-fg">
              <AppGlyph app={a} className="size-full" />
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
