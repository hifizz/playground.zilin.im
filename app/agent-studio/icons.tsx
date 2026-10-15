import React from "react";

/** Outglow Studio 星光 logo */
export function StudioLogo({ size = 20 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-md bg-white text-black"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 16 16" width={size * 0.7} height={size * 0.7} fill="none">
        <path
          d="M8 0v16M0 8h16M2.3 2.3l11.4 11.4M13.7 2.3L2.3 13.7"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Chat 页头像：蓝色 squircle + 两个点 */
export function AssistantAvatar({ size = 56 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[28%]"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(160deg,#7d8fb8 0%,#5a6b95 55%,#46557c 100%)",
        boxShadow: "inset 0 1px 2px rgba(255,255,255,.35), 0 2px 10px rgba(0,0,0,.4)",
      }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55}>
        <rect x="6" y="7" width="12" height="11" rx="4" fill="#dfe6f5" />
        <circle cx="10.5" cy="12.5" r="1.6" fill="#39445e" />
        <circle cx="15" cy="12.5" r="1.6" fill="#39445e" />
      </svg>
    </span>
  );
}

/* ---- 第三方 App 小图标（近似品牌色方块） ---- */

function BrandTile({
  children,
  bg,
  size = 16,
}: {
  children: React.ReactNode;
  bg: string;
  size?: number;
}) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[4px] text-[9px] font-bold leading-none text-white"
      style={{ width: size, height: size, background: bg }}
    >
      {children}
    </span>
  );
}

export const ZendeskIcon = ({ size = 16 }: { size?: number }) => (
  <BrandTile bg="#03363d" size={size}>
    <svg viewBox="0 0 16 16" width={size * 0.7} height={size * 0.7}>
      <path d="M8 3 3 12h4V3zm0 0v9h5L8 3z" fill="#fff" opacity=".95" />
    </svg>
  </BrandTile>
);

export const NotionIcon = ({ size = 16 }: { size?: number }) => (
  <span
    className="grid shrink-0 place-items-center rounded-[4px] border border-white/20 bg-[#191919] font-serif text-[9px] font-bold text-white"
    style={{ width: size, height: size }}
  >
    N
  </span>
);

export const GongIcon = ({ size = 16 }: { size?: number }) => (
  <BrandTile bg="#8036f5" size={size}>
    <svg viewBox="0 0 16 16" width={size * 0.7} height={size * 0.7} fill="#fff">
      <path d="M8 1l1.8 4.2L14 6l-3.2 3 .9 4.5L8 11.2 4.3 13.5 5.2 9 2 6l4.2-.8L8 1z" />
    </svg>
  </BrandTile>
);

export const ClickUpIcon = ({ size = 16 }: { size?: number }) => (
  <span
    className="grid shrink-0 place-items-center rounded-[4px] bg-[#24252a]"
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 16 16" width={size * 0.75} height={size * 0.75}>
      <path d="M3 9c2.5-5 7.5-5 10 0l-1.6 1.6C9.6 7.8 6.4 7.8 4.6 10.6L3 9z" fill="#ff7a59" />
      <path d="M8 11l-2 2.5h4L8 11z" fill="#7b68ee" />
    </svg>
  </span>
);

export const MetabaseIcon = ({ size = 16 }: { size?: number }) => (
  <span
    className="grid shrink-0 place-items-center rounded-[4px] bg-[#22262b]"
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 16 16" width={size * 0.7} height={size * 0.7} fill="none" stroke="#509ee3" strokeWidth="1.5">
      <circle cx="4" cy="12" r="1.4" fill="#509ee3" stroke="none" />
      <circle cx="8" cy="7" r="1.4" fill="#88bf4d" stroke="none" />
      <circle cx="12" cy="4" r="1.4" fill="#ef8c8c" stroke="none" />
      <path d="M4 12 8 7l4-3" strokeWidth="1" opacity=".7" />
    </svg>
  </span>
);

export const SlackIcon = ({ size = 16 }: { size?: number }) => (
  <span
    className="grid shrink-0 place-items-center rounded-[4px] bg-[#1d1c21]"
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 16 16" width={size * 0.7} height={size * 0.7}>
      <rect x="1" y="6" width="4" height="2.2" rx="1.1" fill="#36c5f0" />
      <rect x="6" y="1" width="2.2" height="4" rx="1.1" fill="#36c5f0" />
      <rect x="11" y="8" width="4" height="2.2" rx="1.1" fill="#ecb22e" />
      <rect x="8" y="11" width="2.2" height="4" rx="1.1" fill="#ecb22e" />
      <rect x="8" y="6" width="4" height="2.2" rx="1.1" fill="#2eb67d" />
      <rect x="6" y="8" width="2.2" height="4" rx="1.1" fill="#e01e5a" />
      <rect x="6" y="6" width="2.2" height="2.2" rx="1.1" fill="#e01e5a" />
      <rect x="8" y="8" width="2.2" height="2.2" rx="1.1" fill="#2eb67d" />
    </svg>
  </span>
);

export const FigmaIcon = ({ size = 16 }: { size?: number }) => (
  <span
    className="grid shrink-0 place-items-center rounded-[4px] bg-[#1e1e1e]"
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 16 16" width={size * 0.65} height={size * 0.65}>
      <circle cx="5.4" cy="3" r="2.2" fill="#f24e1e" />
      <circle cx="10.6" cy="3" r="2.2" fill="#ff7262" />
      <circle cx="5.4" cy="8" r="2.2" fill="#a259ff" />
      <circle cx="10.6" cy="8" r="2.2" fill="#1abcfe" />
      <circle cx="5.4" cy="13" r="2.2" fill="#0acf83" />
    </svg>
  </span>
);

export const LinearIcon = ({ size = 16 }: { size?: number }) => (
  <span
    className="grid shrink-0 place-items-center rounded-[4px] bg-[#5e6ad2]"
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 16 16" width={size * 0.7} height={size * 0.7} fill="#fff">
      <path d="M2 9.5 9.5 2c.3 2-.3 4.2-1.9 5.7S2.3 10 2 9.5z" opacity=".9" />
      <path d="M2.5 12.5C4.8 12 7.4 10.6 9.2 8.6l1.9 1.9c-2.5 2.6-6 3.9-8.6 2z" />
    </svg>
  </span>
);

export const GmailIcon = ({ size = 16 }: { size?: number }) => (
  <span
    className="grid shrink-0 place-items-center rounded-[4px] bg-white"
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 16 16" width={size * 0.7} height={size * 0.7}>
      <path d="M2 4.5 8 9l6-4.5V12H2V4.5z" fill="#ea4335" opacity=".9" />
      <path d="M2 4.5V12h2V7l4 3 4-3v5h2V4.5L8 9 2 4.5z" fill="#4285f4" opacity=".85" />
    </svg>
  </span>
);

export const GDriveIcon = ({ size = 16 }: { size?: number }) => (
  <span
    className="grid shrink-0 place-items-center rounded-[4px] bg-[#222]"
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 16 16" width={size * 0.7} height={size * 0.7}>
      <path d="M6 2h4l4.5 8H1.5L6 2z" fill="#188038" opacity=".9" />
      <path d="M6 2 1.5 10l2.5 4.5L10.5 6" fill="#fbbc04" opacity=".9" />
      <path d="M14.5 10 10.5 2H6l4 8" fill="#4285f4" opacity=".9" />
    </svg>
  </span>
);

/** Fable 火花图标（橙色米字） */
export function FableSpark({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="#e8965a" strokeWidth="1.6" strokeLinecap="round">
      <path d="M8 1v14M1 8h14M3 3l10 10M13 3L3 13" />
    </svg>
  );
}

/** OpenAI 花标 */
export function OpenAISpark({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="#d4d4d4" strokeWidth="1.3">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 1.5c4 2 4 11 0 13M1.5 8c2-4 11-4 13 0" />
    </svg>
  );
}
