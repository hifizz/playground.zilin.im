"use client";

import React, { useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUser,
  Clock,
  GripVertical,
  Inbox,
  Info,
  Layers,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Minus,
  Monitor,
  Moon,
  Paperclip,
  Plus,
  Repeat2,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Square,
  Sun,
  TriangleAlert,
  Workflow,
  X,
  Zap,
  FileText,
  Package,
} from "lucide-react";
import {
  AssistantAvatar,
  ClickUpIcon,
  FableSpark,
  FigmaIcon,
  GDriveIcon,
  GmailIcon,
  GongIcon,
  LinearIcon,
  MetabaseIcon,
  NotionIcon,
  OpenAISpark,
  SlackIcon,
  StudioLogo,
  ZendeskIcon,
} from "./icons";

/* ============================== 通用小组件 ============================== */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-white/15 bg-white/5 px-1 text-[10px] text-neutral-500">
      {children}
    </span>
  );
}

function ToolRow({
  icon,
  label,
  suffix,
  checked,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  suffix?: React.ReactNode;
  checked?: boolean;
}) {
  return (
    <div className="relative flex items-center gap-2 py-[7px] pl-6 pr-2 text-[13px] text-neutral-300">
      {checked && (
        <Check size={13} strokeWidth={3} className="absolute left-0 text-neutral-400" />
      )}
      {icon}
      <span className="truncate">{label}</span>
      {suffix}
    </div>
  );
}

/* ============================== 侧边栏 ============================== */

const AGENTS = [
  "Product Discovery",
  "UX Research Synthesizer",
  "Design Critique",
  "Design System Guardian",
  "UX Writing Agent",
  "Usability Test Runner",
];

function Sidebar({
  active,
  onNavigate,
  onOpenWorkspace,
}: {
  active: "chat" | "agent";
  onNavigate: (v: "chat" | "agent") => void;
  onOpenWorkspace: () => void;
}) {
  return (
    <aside className="flex w-[226px] shrink-0 flex-col border-r border-white/10 bg-[#0e0e10]">
      {/* 工作区头 */}
      <button
        onClick={onOpenWorkspace}
        className="flex h-12 items-center gap-2 border-b border-white/10 px-3 text-left hover:bg-white/5"
      >
        <StudioLogo size={20} />
        <span className="text-[13.5px] font-medium text-neutral-100">
          Outglow Studio
        </span>
        <ChevronDown size={14} className="ml-auto text-neutral-500" />
        <span className="grid size-5 place-items-center rounded border border-white/15 text-neutral-500">
          <Layers size={11} />
        </span>
      </button>

      {/* 搜索 */}
      <div className="px-3 pt-3">
        <div className="flex h-8 items-center gap-2 rounded-md bg-white/5 px-2.5 text-[12.5px] text-neutral-500">
          <Search size={13} />
          Search...
          <span className="ml-auto flex gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </div>
      </div>

      {/* 主导航 */}
      <nav className="mt-2 space-y-0.5 px-3 text-[13px] text-neutral-400">
        <button
          onClick={() => onNavigate("chat")}
          className={`flex w-full items-center gap-2.5 rounded-md px-2 py-[7px] ${
            active === "chat" ? "bg-white/10 text-neutral-100" : "hover:bg-white/5"
          }`}
        >
          <MessageSquare size={15} /> Chat
        </button>
        <SideItem icon={<Inbox size={15} />} label="Inbox" />
        <div className="pb-1 pt-3">
          <SideItem icon={<BookOpen size={15} />} label="Templates" />
          <SideItem icon={<Workflow size={15} />} label="Integrations" />
          <SideItem icon={<Package size={15} />} label="Skills" />
        </div>
      </nav>

      {/* Agents */}
      <div className="px-3">
        <div className="flex items-center justify-between border-t border-white/10 px-2 py-2 text-[12px] text-neutral-500">
          Agents
          <Plus size={14} />
        </div>
        <div className="space-y-0.5 text-[13px]">
          {AGENTS.map((a, i) => (
            <button
              key={a}
              onClick={() => onNavigate("agent")}
              className={`flex w-full items-center gap-2.5 rounded-md px-2 py-[6px] ${
                i === 0 && active === "agent"
                  ? "bg-white/10 text-neutral-100"
                  : "text-neutral-400 hover:bg-white/5"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  i === 0 ? "bg-neutral-300" : "border border-neutral-500"
                }`}
              />
              {a}
            </button>
          ))}
          <div className="flex items-center gap-2.5 px-2 py-[6px] text-neutral-500">
            <Plus size={13} /> More agents
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-0.5 px-3 pb-2 text-[13px] text-neutral-400">
        <SideItem icon={<BarChart3 size={15} />} label="Usage" />
        <SideItem icon={<Settings size={15} />} label="Settings" />
      </div>

      {/* Connect more apps */}
      <div className="border-t border-white/10 p-3">
        <div className="rounded-lg bg-white/5 p-3">
          <div className="flex items-center justify-between text-[12.5px] font-medium text-neutral-200">
            Connect more apps
            <span className="grid size-5 place-items-center rounded-md border border-white/15 text-neutral-400">
              <Plus size={12} />
            </span>
          </div>
          <p className="mt-1 text-[11.5px] leading-snug text-neutral-500">
            More sources in, better answers out.
          </p>
          <div className="mt-2.5 flex items-center gap-1.5">
            <GmailIcon size={16} />
            <GDriveIcon size={16} />
            <SlackIcon size={16} />
            <FigmaIcon size={16} />
            <span className="grid size-4 place-items-center rounded-[4px] bg-white/10 text-[9px] text-neutral-400">
              <Sun size={10} />
            </span>
            <span className="grid size-4 place-items-center rounded-[4px] bg-[#101828] text-[8px] font-bold text-white">
              Z
            </span>
            <LinearIcon size={16} />
            <span className="grid size-4 place-items-center rounded-[4px] bg-white/10">
              <Zap size={10} className="text-neutral-300" />
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SideItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-[7px] hover:bg-white/5">
      {icon}
      {label}
    </button>
  );
}

/* ============================== 工作区下拉菜单 ============================== */

function WorkspaceMenu({ onClose }: { onClose: () => void }) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed left-3 top-12 z-50 w-[300px] rounded-xl border border-white/10 bg-[#17171a] p-1.5 shadow-2xl shadow-black/60">
        {/* tabs */}
        <div className="mb-1 flex rounded-full bg-white/5 p-0.5 text-[13px]">
          <button className="flex-1 rounded-full bg-white/10 py-1.5 font-medium text-neutral-100">
            Agents
          </button>
          <button className="flex-1 rounded-full py-1.5 text-neutral-400 hover:text-neutral-200">
            Workbench
          </button>
        </div>
        <div className="space-y-0.5 text-[13.5px] text-neutral-300">
          <MenuRow icon={<Building2 size={16} />} label="Organization settings" chevron />
          <MenuRow icon={<CircleUser size={16} />} label="Profile settings" chevron />
          <div className="flex items-center justify-between rounded-md px-2.5 py-2 hover:bg-white/5">
            <span className="flex items-center gap-3">
              <Moon size={16} className="text-neutral-400" /> Appearance
            </span>
            <span className="flex rounded-full bg-white/10 p-0.5">
              {(
                [
                  ["light", Sun],
                  ["dark", Moon],
                  ["system", Monitor],
                ] as const
              ).map(([k, I]) => (
                <button
                  key={k}
                  onClick={() => setTheme(k)}
                  className={`grid size-6 place-items-center rounded-full ${
                    theme === k ? "bg-white/15 text-neutral-100" : "text-neutral-500"
                  }`}
                >
                  <I size={12} />
                </button>
              ))}
            </span>
          </div>
        </div>
        <div className="my-1 border-t border-white/10" />
        <div className="space-y-0.5 text-[13.5px] text-neutral-300">
          <MenuRow icon={<LifeBuoy size={16} />} label="Support" />
          <MenuRow icon={<Zap size={16} />} label="What's new" />
        </div>
        <div className="my-1 border-t border-white/10" />
        <MenuRow icon={<LogOut size={16} />} label="Log out" />
      </div>
    </>
  );
}

function MenuRow({
  icon,
  label,
  chevron,
}: {
  icon: React.ReactNode;
  label: string;
  chevron?: boolean;
}) {
  return (
    <button className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 hover:bg-white/5">
      <span className="text-neutral-400">{icon}</span>
      {label}
      {chevron && <ChevronRight size={14} className="ml-auto text-neutral-500" />}
    </button>
  );
}

/* ============================== Agent 会话面板 ============================== */

function RunChip() {
  return (
    <div className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-[#141416] px-3 text-[13px]">
      <span className="text-neutral-200">Run</span>
      <span className="flex items-center gap-1 rounded-md border border-[#3b5dd9]/60 bg-[#1b2d63]/60 px-1.5 py-0.5 text-[12px] text-[#9db4ff]">
        <Zap size={11} /> discovery-agent
      </span>
      <span className="text-neutral-200">over the past 7 days</span>
      <span className="ml-auto grid size-7 place-items-center rounded-md bg-white/10">
        <Square size={11} className="fill-neutral-200 text-neutral-200" />
      </span>
    </div>
  );
}

function ConversationPanel() {
  const [subOpen, setSubOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);

  return (
    <div className="flex w-[340px] shrink-0 flex-col border-r border-white/10 bg-[#0b0b0d]">
      <div className="flex-1 space-y-4 overflow-y-auto p-3 text-[13px] leading-relaxed text-neutral-300">
        <RunChip />

        <p>
          Starting the weekly pass. Pulling signals from the last 7 days across
          Zendesk, Gong, ClickUp, Notion, Metabase and #customer-feedback — same
          sources as last time, so the ranking stays comparable.
        </p>
        <p>
          Read the two memories first: product-strategy-h2 for what counts as a
          fit, opportunities-archive so a theme that was already scored is not
          scored again.
        </p>
        <p>
          Last run cleared three clusters above threshold. Two clusters didn&apos;t
          — listed at the bottom, don&apos;t ignore them, some are just early.
        </p>

        {/* Read tools */}
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[12px] text-neutral-500">
            <GripVertical size={12} /> Read tools
          </div>
          <div className="border-l border-white/10">
            <ToolRow checked icon={<ZendeskIcon />} label="Zendesk Search" />
            <ToolRow checked icon={<NotionIcon />} label="Notion Sync" />
            <ToolRow checked icon={<GongIcon />} label="Gong List Calls" />
            <ToolRow checked icon={<ClickUpIcon />} label="ClickUp Filter Task" />
            <ToolRow checked icon={<MetabaseIcon />} label="Metabase Query" />
            <ToolRow
              checked
              icon={<SlackIcon />}
              label={
                <>
                  Slack History{" "}
                  <span className="text-neutral-500">#customer-feedback</span>
                </>
              }
            />
          </div>
        </div>

        {/* Sub-agents / Skills 折叠卡片 */}
        <div className="overflow-hidden rounded-xl border border-white/10">
          <button
            onClick={() => setSubOpen(!subOpen)}
            className="flex w-full items-center gap-1.5 px-3 py-2.5 text-[13px] hover:bg-white/5"
          >
            <ChevronRight
              size={14}
              className={`text-neutral-500 transition-transform ${subOpen ? "rotate-90" : ""}`}
            />
            Sub-agents <span className="text-neutral-500">· 5 agents</span>
          </button>
          {subOpen && (
            <div className="border-t border-white/10 pb-1">
              {[
                "signal_collector",
                "theme_clusterer",
                "opportunity_score",
                "evidence_linker",
                "digest_writer",
              ].map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-neutral-400"
                >
                  <span className="grid size-5 place-items-center rounded-md border border-white/10 bg-white/5">
                    <FileText size={11} />
                  </span>
                  {s}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setSkillsOpen(!skillsOpen)}
            className="flex w-full items-center gap-1.5 border-t border-white/10 px-3 py-2.5 text-[13px] hover:bg-white/5"
          >
            <ChevronRight
              size={14}
              className={`text-neutral-500 transition-transform ${skillsOpen ? "rotate-90" : ""}`}
            />
            Skills <span className="text-neutral-500">· 3 skills</span>
          </button>
          {skillsOpen && (
            <div className="border-t border-white/10 pb-1">
              {[
                "onboarding-discovery-agent",
                "opportunity-solution-tree",
                "rice-scoring",
              ].map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-neutral-400"
                >
                  <span className="grid size-5 place-items-center rounded-md border border-white/10 bg-white/5">
                    <Package size={11} />
                  </span>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thinking + 输入 */}
      <div className="space-y-2.5 p-3">
        <div className="flex items-center gap-2 text-[12px] text-neutral-500">
          <GripVertical size={12} />
          Thinking <span className="font-medium text-neutral-400">2m 7s</span>·
          4.6k tokens
        </div>
        <div className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 bg-[#141416] px-3 text-[12px] text-neutral-400">
          <Info size={13} />
          You&apos;ve used 80% of your tokens.{" "}
          <span className="text-[#7fa0f8]">View usage</span>
          <X size={13} className="ml-auto text-neutral-500" />
        </div>
        <div className="rounded-xl border border-white/10 bg-[#141416] p-2">
          <div className="px-1 pb-6 text-[13px] text-neutral-500">
            Add a follow-up
          </div>
          <div className="flex items-center justify-between">
            <Paperclip size={15} className="text-neutral-500" />
            <span className="grid size-7 place-items-center rounded-full bg-white/10">
              <Send size={13} className="text-neutral-400" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== 画布节点 ============================== */

function NodeCard({
  title,
  badge,
  accent,
  children,
  className,
  style,
  port,
  portLeft,
}: {
  title: React.ReactNode;
  badge?: React.ReactNode;
  accent?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  port?: "gray" | "blue" | "orange";
  portLeft?: number;
}) {
  return (
    <div
      className={`absolute w-[210px] rounded-xl border bg-[#141417]/95 shadow-lg shadow-black/30 backdrop-blur ${
        accent ? "border-[#3b5dd9]/70" : "border-white/10"
      } ${className ?? ""}`}
      style={style}
    >
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2 text-[12.5px] text-neutral-300">
        <ChevronDown size={13} className="text-neutral-500" />
        {title}
        {badge}
        {/* 连接点 */}
        {port && (
          <span
            className={`absolute -right-[5px] top-1/2 size-2.5 -translate-y-1/2 rounded-full border-2 border-[#0b0b0d] ${
              port === "blue"
                ? "bg-[#4d7dff]"
                : port === "orange"
                  ? "bg-[#e8965a]"
                  : "bg-neutral-500"
            }`}
          />
        )}
        {portLeft !== undefined && (
          <span
            className="absolute -left-[5px] size-2.5 rounded-full border-2 border-[#0b0b0d] bg-neutral-500"
            style={{ top: portLeft }}
          />
        )}
      </div>
      {children && <div className="px-3 py-1.5 text-[12px]">{children}</div>}
    </div>
  );
}

function BadgeNew() {
  return (
    <span className="ml-1 rounded border border-[#3b5dd9]/60 bg-[#1b2d63]/50 px-1 py-px text-[10px] text-[#9db4ff]">
      New
    </span>
  );
}

function Canvas() {
  return (
    <div className="relative flex-1 overflow-hidden bg-[#0b0b0d]">
      {/* 点阵背景 */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      {/* 左上小方块 */}
      <div className="absolute left-4 top-4 grid size-7 place-items-center rounded-md border border-white/10 text-neutral-500">
        <Layers size={13} />
      </div>

      {/* 连线 SVG */}
      <svg className="pointer-events-none absolute inset-0 size-full">
        {/* schedule → agent */}
        <path d="M270 218 C 320 218, 340 258, 420 258" fill="none" stroke="rgba(255,255,255,.28)" strokeDasharray="2 4" strokeWidth="1.2" />
        {/* triggers → agent */}
        <path d="M270 360 C 330 360, 350 300, 420 272" fill="none" stroke="rgba(96,140,255,.7)" strokeDasharray="2 4" strokeWidth="1.2" />
        {/* channels → agent */}
        <path d="M270 470 C 330 470, 355 330, 420 285" fill="none" stroke="rgba(232,150,90,.7)" strokeDasharray="2 4" strokeWidth="1.2" />
        {/* memory → agent */}
        <path d="M270 585 C 335 585, 350 340, 420 300" fill="none" stroke="rgba(96,140,255,.7)" strokeDasharray="2 4" strokeWidth="1.2" />
        {/* agent → tools */}
        <path d="M632 262 C 690 258, 720 195, 778 195" fill="none" stroke="rgba(255,255,255,.28)" strokeDasharray="2 4" strokeWidth="1.2" />
        {/* agent → subagents */}
        <path d="M632 300 C 690 330, 720 430, 778 455" fill="none" stroke="rgba(255,255,255,.28)" strokeDasharray="2 4" strokeWidth="1.2" />
        {/* agent → skills */}
        <path d="M632 330 C 690 420, 730 660, 778 725" fill="none" stroke="rgba(255,255,255,.28)" strokeDasharray="2 4" strokeWidth="1.2" />
      </svg>

      {/* ---- 左列 ---- */}
      <NodeCard
        title="Schedule"
        style={{ left: 60, top: 160 }}
        port="gray"
      >
        <div className="space-y-1 py-1 text-neutral-300">
          <div className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5">
            <Clock size={12} className="text-neutral-500" />
            Mon 08:00 AM · weekly digest
          </div>
          <div className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5">
            <Clock size={12} className="text-neutral-500" />
            cron 0 8 * * 1 · CEST
          </div>
        </div>
      </NodeCard>

      <NodeCard
        title="Triggers"
        badge={<BadgeNew />}
        accent
        style={{ left: 60, top: 290 }}
        port="blue"
      >
        <div className="space-y-1 py-1 text-neutral-300">
          <div className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5">
            <ZendeskIcon size={13} /> Zendesk webhook
          </div>
          <div className="rounded-md bg-white/5 px-2 py-1.5 text-neutral-400">
            tag=enterprise{" "}
            <span className="mx-0.5 rounded border border-white/15 bg-white/5 px-1 text-[10px]">
              AND
            </span>{" "}
            urgent
          </div>
        </div>
      </NodeCard>

      <NodeCard
        title="Channels"
        badge={
          <span className="ml-1 flex items-center gap-1 rounded border border-[#e8965a]/50 bg-[#e8965a]/10 px-1 py-px text-[10px] text-[#e8965a]">
            <TriangleAlert size={9} /> Set identity
          </span>
        }
        style={{ left: 60, top: 430 }}
        port="orange"
      >
        <p className="py-1 text-neutral-400">
          Set an agent identity to configure channels
        </p>
      </NodeCard>

      <NodeCard
        title="Memory"
        badge={<BadgeNew />}
        accent
        style={{ left: 60, top: 545 }}
        port="blue"
      >
        <div className="space-y-1 py-1 text-neutral-300">
          {["product-strategy-h2", "opportunities-archive"].map((m) => (
            <div
              key={m}
              className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5"
            >
              <GripVertical size={11} className="text-neutral-600" />
              {m}
            </div>
          ))}
        </div>
      </NodeCard>

      {/* ---- 中列：Agent ---- */}
      <div
        className="absolute w-[212px] rounded-xl border border-white/10 bg-[#141417]/95 shadow-lg shadow-black/30 backdrop-blur"
        style={{ left: 420, top: 140 }}
      >
        <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2 text-[12.5px] text-neutral-300">
          <ChevronDown size={13} className="text-neutral-500" /> Agent
          <span className="absolute -left-[6px] top-[60px] size-2.5 rounded-full border-2 border-[#0b0b0d] bg-neutral-500" />
          <span className="absolute -left-[6px] top-[130px] size-2.5 rounded-full border-2 border-[#0b0b0d] bg-[#4d7dff]" />
          <span className="absolute -left-[6px] top-[160px] size-2.5 rounded-full border-2 border-[#0b0b0d] bg-[#e8965a]" />
          <span className="absolute -right-[5px] top-[120px] size-2.5 rounded-full border-2 border-[#0b0b0d] bg-neutral-500" />
          <span className="absolute -right-[5px] top-[160px] size-2.5 rounded-full border-2 border-[#0b0b0d] bg-neutral-500" />
          <span className="absolute -right-[5px] top-[200px] size-2.5 rounded-full border-2 border-[#0b0b0d] bg-neutral-500" />
        </div>
        <div className="px-3 py-2.5">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <p className="text-[12.5px] font-medium text-neutral-100">
              Product Discovery Agent
            </p>
            <p className="mt-1 text-[12px] leading-snug text-neutral-400">
              Turns scattered signals into ranked opportunities
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 border-t border-white/10 px-3 py-2 text-[12.5px] text-neutral-300">
          <ChevronDown size={13} className="text-neutral-500" /> Instructions
        </div>
        <div className="px-3 pb-3">
          <div className="relative max-h-[118px] overflow-hidden rounded-lg border border-white/10 bg-white/5 p-2.5">
            <p className="text-[12.5px] font-medium text-neutral-100">
              Product Discovery Agent
            </p>
            <p className="mt-1 text-[12px] leading-snug text-neutral-400">
              Full system prompt. This is what sits behind the truncated line in
              the INSTRUCTIONS block. Version 1.1 · owner: Arek · last change:
              severity override
            </p>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#1a1a1e] to-transparent" />
          </div>
        </div>
      </div>

      {/* ---- 右列 ---- */}
      <NodeCard title="Tools" style={{ left: 780, top: 160 }} portLeft={35}>
        <div className="space-y-1 py-1 text-neutral-300">
          <div className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5">
            <ZendeskIcon size={13} /> Zendesk Search
          </div>
          <div className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5">
            <NotionIcon size={13} /> Notion Sync
          </div>
          <div className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5">
            <GongIcon size={13} /> Gong List Calls
          </div>
          <div className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5">
            <ClickUpIcon size={13} /> ClickUp Filter Task
          </div>
          <div className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5 text-neutral-400">
            <GripVertical size={11} className="text-neutral-600" /> Show 2 more
          </div>
        </div>
      </NodeCard>

      <NodeCard title="Sub-agents" style={{ left: 780, top: 430 }} portLeft={25}>
        <div className="space-y-1 py-1 text-neutral-300">
          {[
            "signal_collector",
            "theme_clusterer",
            "opportunity_score",
            "evidence_linker",
            "digest_writer",
          ].map((s) => (
            <div
              key={s}
              className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5"
            >
              <FileText size={11} className="text-neutral-500" />
              {s}
            </div>
          ))}
        </div>
      </NodeCard>

      <NodeCard title="Skills" style={{ left: 780, top: 700 }} portLeft={25}>
        <div className="space-y-1 py-1 text-neutral-300">
          {[
            "onboarding-discovery-agent",
            "opportunity-solution-tree",
            "rice-scoring",
          ].map((s) => (
            <div
              key={s}
              className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5"
            >
              <Package size={11} className="text-neutral-500" />
              {s}
            </div>
          ))}
        </div>
      </NodeCard>

      {/* 缩放控件 */}
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[#141417] px-3 py-1.5 text-[12px] text-neutral-300">
        <Plus size={13} />
        100%
        <Minus size={13} />
      </div>
    </div>
  );
}

/* ============================== Chat 视图 ============================== */

const MODELS = [
  { name: "Fable 5", icon: <FableSpark /> },
  { name: "Opus 5", icon: <FableSpark /> },
  { name: "Sonnet 5", icon: <FableSpark /> },
  { name: "Haiku 4.5", icon: <FableSpark /> },
  { name: "GPT-5", icon: <OpenAISpark /> },
];

const SUGGESTIONS = [
  {
    icon: <FileText size={14} className="text-neutral-500" />,
    text: (
      <>
        Summarise this week&apos;s support tickets{" "}
        <ZendeskIcon size={14} /> <SlackIcon size={14} />
      </>
    ),
  },
  {
    icon: <MessageSquare size={14} className="text-neutral-500" />,
    text: (
      <>
        Review a design <FigmaIcon size={14} /> before handoff{" "}
        <ClickUpIcon size={14} />
      </>
    ),
  },
  {
    icon: <Repeat2 size={14} className="text-neutral-500" />,
    text: (
      <>
        Turn a weekly chore <MetabaseIcon size={14} /> <SlackIcon size={14} />{" "}
        <NotionIcon size={14} /> into an agent
      </>
    ),
  },
];

function ChatView() {
  const [model, setModel] = useState("Fable 5");
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center bg-[#0b0b0d]">
      <div className="w-full max-w-[620px] -translate-y-6 px-6">
        <AssistantAvatar size={56} />
        <h1 className="mt-4 text-[22px] font-medium text-neutral-100">
          Who&apos;s on it today?
        </h1>

        {/* token 提示 */}
        <div className="mt-5 flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-[#141416] px-3 text-[12.5px] text-neutral-400">
          <Info size={13} />
          You&apos;ve used 80% of your tokens.{" "}
          <span className="text-[#7fa0f8]">View usage</span>
          <X size={13} className="ml-auto text-neutral-500" />
        </div>

        {/* 输入框 */}
        <div className="mt-2 rounded-xl border border-white/15 bg-[#141416] p-3 focus-within:border-[#3b5dd9]/70">
          <input
            ref={inputRef}
            placeholder="Ask anything, or type @ to mention an agent"
            className="w-full bg-transparent text-[13.5px] text-neutral-200 outline-none placeholder:text-neutral-500"
          />
          <div className="mt-8 flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg border border-white/15 text-neutral-500 hover:bg-white/5">
              <Paperclip size={14} />
            </span>
            <span className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] text-neutral-200 hover:bg-white/5"
              >
                <FableSpark size={13} />
                {model}
                <ChevronDown size={13} className="text-neutral-500" />
              </button>
              {/* 模型下拉：向上展开 */}
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute bottom-full left-0 z-50 mb-2 w-[220px] rounded-xl border border-white/10 bg-[#17171a] p-1.5 shadow-2xl shadow-black/60">
                    {MODELS.map((m) => (
                      <button
                        key={m.name}
                        onClick={() => {
                          setModel(m.name);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] text-neutral-200 hover:bg-white/5"
                      >
                        {m.icon}
                        {m.name}
                        {model === m.name && (
                          <Check size={14} className="ml-auto text-neutral-300" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </span>
            <span className="ml-auto grid size-7 place-items-center rounded-full bg-white/10">
              <Send size={13} className="text-neutral-400" />
            </span>
          </div>
        </div>

        {/* 推荐 */}
        <div className="mt-5">
          <p className="text-[12px] font-medium text-neutral-500">
            Recommended for you
          </p>
          <div className="mt-2 space-y-2.5">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="flex items-center gap-2.5 text-[13.5px] text-neutral-300 hover:text-neutral-100"
              >
                {s.icon}
                <span className="flex items-center gap-1.5">{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

/* ============================== 顶层 ============================== */

export default function AgentStudioDemo() {
  const [view, setView] = useState<"agent" | "chat">("agent");
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  return (
    <div className="dark flex h-screen w-full overflow-hidden bg-[#0a0a0a] text-neutral-200">
      <Sidebar
        active={view === "chat" ? "chat" : "agent"}
        onNavigate={setView}
        onOpenWorkspace={() => setWorkspaceOpen(true)}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        {workspaceOpen && <WorkspaceMenu onClose={() => setWorkspaceOpen(false)} />}

        {/* 顶栏 */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 px-4">
          {view === "agent" ? (
            <>
              <ArrowLeft size={15} className="text-neutral-400" />
              <span className="text-[13px] text-neutral-400">Agents /</span>
              <span className="text-[13px] font-medium text-neutral-100">
                Product Discovery
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button className="rounded-md border border-white/10 px-2.5 py-1 text-[12px] text-neutral-300 hover:bg-white/5">
                  Share
                </button>
                <button className="rounded-md border border-white/10 px-2.5 py-1 text-[12px] text-neutral-300 hover:bg-white/5">
                  Save agent
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-[13px] font-medium text-neutral-100">Chat</span>
              <div className="ml-auto flex items-center gap-2 text-neutral-400">
                <button className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-[12px] hover:bg-white/5">
                  <Plus size={12} /> New chat
                </button>
                <SlidersHorizontal size={14} />
              </div>
            </>
          )}
        </header>

        {/* 内容 */}
        <div className="flex min-h-0 flex-1">
          {view === "agent" ? (
            <>
              <ConversationPanel />
              <Canvas />
            </>
          ) : (
            <ChatView />
          )}
        </div>
      </div>
    </div>
  );
}
