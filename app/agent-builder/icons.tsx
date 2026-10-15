import type { CSSProperties } from "react";
import type { AppId } from "./data";

const GLYPHS: Record<AppId, React.ReactNode> = {
  zendesk: (
    <g fill="currentColor">
      <path d="M2.5 4h9.2a4.6 4.6 0 0 1-9.2 0z" />
      <path d="M11.7 7.5V20H2.5z" />
      <path d="M12.3 4H21.5L12.3 16.5z" />
      <path d="M21.5 20h-9.2a4.6 4.6 0 0 1 9.2 0z" />
    </g>
  ),
  notion: (
    <g>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
      <path d="M8.5 7.5v9M8.5 7.5l7 9M15.5 7.5v9" style={{ stroke: "var(--ab-raised)" }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  ),
  gong: (
    <g>
      <path d="M12 2.5l2.2 2.4 3.2-.7.8 3.2 3 1.3-1.2 3 1.2 3-3 1.3-.8 3.2-3.2-.7L12 21.5l-2.2-2.4-3.2.7-.8-3.2-3-1.3 1.2-3-1.2-3 3-1.3.8-3.2 3.2.7z" fill="#8b5cf6" />
      <circle cx="12" cy="12" r="3.6" fill="#1b1230" />
    </g>
  ),
  clickup: (
    <g>
      <path d="M12 3.2 6.2 8.2l2 2.3L12 7.2l3.8 3.3 2-2.3z" fill="#7b68ee" />
      <path d="M4.5 15.2l2.2-2.5a7.2 7.2 0 0 0 10.6 0l2.2 2.5a10.6 10.6 0 0 1-15 0z" fill="#ff4f8b" />
      <path d="M8 15.8a5.8 5.8 0 0 0 8 0l1.4 1.6a8 8 0 0 1-10.8 0z" fill="#ffb02e" />
    </g>
  ),
  metabase: (
    <g fill="#b5b9c4">
      {[4, 8, 12, 16, 20].map((x) => (
        <circle key={`t${x}`} cx={x} cy={x === 12 ? 8 : x === 8 || x === 16 ? 12 : 6} r="1.7" />
      ))}
      {[4, 12, 20].map((x) => (
        <circle key={`b${x}`} cx={x} cy={16} r="1.7" />
      ))}
      <circle cx="4" cy="12" r="1.7" />
      <circle cx="20" cy="12" r="1.7" />
    </g>
  ),
  slack: (
    <g>
      <rect x="10" y="2" width="3.4" height="8.6" rx="1.7" fill="#36c5f0" />
      <rect x="13.4" y="10" width="8.6" height="3.4" rx="1.7" fill="#2eb67d" />
      <rect x="10.6" y="13.4" width="3.4" height="8.6" rx="1.7" fill="#ecb22e" />
      <rect x="2" y="10.6" width="8.6" height="3.4" rx="1.7" fill="#e01e5a" />
    </g>
  ),
  figma: (
    <g>
      <path d="M8 22a4 4 0 0 0 4-4v-4H8a4 4 0 0 0 0 8z" fill="#0acf83" />
      <path d="M4 14a4 4 0 0 1 4-4h4v8H8a4 4 0 0 1-4-4z" fill="#a259ff" />
      <path d="M4 6a4 4 0 0 1 4-4h4v8H8a4 4 0 0 1-4-4z" fill="#f24e1e" />
      <path d="M12 2h4a4 4 0 0 1 0 8h-4z" fill="#ff7262" />
      <circle cx="16" cy="14" r="4" fill="#1abcfe" />
    </g>
  ),
  gmail: <path d="M3.5 18V7l8.5 6.5L20.5 7v11" fill="none" stroke="#ea4335" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />,
  gdrive: (
    <g>
      <rect x="3" y="3" width="18" height="18" rx="3.5" fill="#4285f4" />
      <path d="M8 9h8M8 12h8M8 15h5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  ),
  github: (
    <path fill="currentColor" d="M12 2.2a9.8 9.8 0 0 0-3.1 19.100c.5.1.7-.2.7-.5v-1.800c-2.7.6-3.3-1.2-3.3-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.8.8.1-.6.3-1.1.6-1.3-2.2-.3-4.4-1.1-4.4-4.8 0-1.1.4-1.9 1-2.6-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.2 9.2 0 0 1 4.9 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.5 1 2.6 0 3.7-2.2 4.5-4.4 4.7.4.3.7.9.7 1.800v2.700c0 .3.2.6.7.5A9.8 9.8 0 0 0 12 2.200z" />
  ),
  gitlab: (
    <g>
      <path d="M12 21 3 14l1.8-5.600L7 14h10l2.2-5.600L21 14z" fill="#fc6d26" />
      <path d="M12 21 7 14h10z" fill="#e24329" />
      <path d="M4.8 8.4 3 14l-.6-.5a1 1 0 0 1-.3-1.100zM19.2 8.4 21 14l.6-.5a1 1 0 0 0 .3-1.100z" fill="#fca326" />
    </g>
  ),
  linear: (
    <g>
      <circle cx="12" cy="12" r="9" fill="#5e6ad2" />
      <path d="M5 12.5 11.5 19M5.5 9.5 14.5 18.500M8 6.5 17.5 16" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity=".85" />
    </g>
  ),
  openai: (
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      {[0, 60, 120].map((r) => (
        <rect key={r} x="7.6" y="2.8" width="8.8" height="18.4" rx="4.4" transform={`rotate(${r} 12 12)`} />
      ))}
    </g>
  ),
  fable: (
    <g stroke="#e8805f" strokeWidth="1.6" strokeLinecap="round">
      {[0, 30, 60, 90, 120, 150].map((r) => (
        <line key={r} x1="12" y1="2.8" x2="12" y2="21.2" transform={`rotate(${r} 12 12)`} />
      ))}
    </g>
  ),
};

export function AppGlyph({ app, className }: { app: AppId; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {GLYPHS[app]}
    </svg>
  );
}

/** 带边框的小圆角方块 + 应用图标 */
export function AppChip({ app, size = 22, className = "" }: { app: AppId; size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md border border-ab-line bg-ab-raised text-ab-fg ${className}`}
      style={{ width: size, height: size }}
    >
      <AppGlyph app={app} className="size-[62%]" />
    </span>
  );
}

export function StudioLogo({ size = 22 }: { size?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-[7px] bg-white" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" className="size-[72%]" aria-hidden>
        <g stroke="#111" strokeWidth="2" strokeLinecap="round">
          {[0, 45, 90, 135].map((r) => (
            <line key={r} x1="12" y1="3.5" x2="12" y2="20.5" transform={`rotate(${r} 12 12)`} />
          ))}
        </g>
        <circle cx="12" cy="12" r="2.2" fill="#fff" />
      </svg>
    </span>
  );
}

/** 3x3 点阵：运行时依次呼吸 */
export function DotsGrid({ active, className = "" }: { active: boolean; className?: string }) {
  return (
    <span className={`grid size-3.5 shrink-0 grid-cols-3 gap-[2px] ${className}`} aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className="rounded-full bg-current"
          style={
            {
              animationName: active ? "ab-dot" : undefined,
              animationDuration: "1.2s",
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDelay: `${((i % 3) + Math.floor(i / 3)) * 0.14}s`,
              opacity: active ? undefined : 0.7,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

export function Mascot({ size = 80 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.27,
        background: "linear-gradient(155deg,#b8c3f0 0%,#8c9ad6 38%,#4c5a9c 100%)",
        boxShadow: "inset 2px 3px 6px rgba(255,255,255,.45), inset -3px -5px 10px rgba(20,28,80,.5), 0 6px 18px rgba(10,14,40,.5)",
      }}
    >
      <span className="absolute rounded-[40%] bg-[#1b2146]" style={{ left: "27%", top: "40%", width: "12%", height: "26%", transform: "rotate(-8deg)" }} />
      <span className="absolute rounded-[40%] bg-[#1b2146]" style={{ left: "58%", top: "40%", width: "12%", height: "26%", transform: "rotate(-8deg)" }} />
    </div>
  );
}
