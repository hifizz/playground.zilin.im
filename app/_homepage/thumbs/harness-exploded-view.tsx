export function HarnessExplodedViewThumb() {
  // 缩略图纯静态（无 use client）：迷你爆炸图，纸面网格 + 线描模块栈，
  // Memory 层橙色高亮 + 引线标注，呼应真实页面的工程图纸质感。
  const ink = "#1a1a1a";
  const grey = "#6b675f";
  const accent = "#d9480f";
  const accentText = "#b33a0b";

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        background: "#fbfaf7",
        backgroundImage:
          "linear-gradient(#e4dfd3 1px, transparent 1px), linear-gradient(90deg, #e4dfd3 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        backgroundPosition: "-1px -1px",
        padding: "10px 14px",
      }}
    >
      <style>{`
        @keyframes hxv-thumb-rise { from { transform: translateY(0); } to { transform: translateY(-3px); } }
        @keyframes hxv-thumb-fall { from { transform: translateY(0); } to { transform: translateY(3px); } }
      `}</style>
      <svg
        viewBox="0 0 220 150"
        className="h-full w-full"
        style={{ maxHeight: 132 }}
        role="img"
        aria-label="Agent Harness 模块爆炸图缩略图"
      >
        {/* 中轴：红色虚线 */}
        <line x1="110" y1="6" x2="110" y2="144" stroke="#c33" strokeWidth="0.8" strokeDasharray="2 4" />

        {/* eval：顶部锥体 */}
        <g style={{ animation: "hxv-thumb-rise 3.2s ease-in-out infinite alternate" }}>
          <path d="M110 8 L96 24 A14 4 0 0 0 124 24 Z" fill="none" stroke={ink} strokeWidth="1" />
          <ellipse cx="110" cy="24" rx="14" ry="4" fill="none" stroke={ink} strokeWidth="1" />
        </g>

        {/* gateway：带触角的小毂 */}
        <g style={{ animation: "hxv-thumb-fall 3.6s ease-in-out infinite alternate" }}>
          <ellipse cx="110" cy="34" rx="17" ry="4.5" fill="none" stroke={ink} strokeWidth="1" />
          <ellipse cx="110" cy="43" rx="17" ry="4.5" fill="none" stroke={ink} strokeWidth="1" />
          <line x1="127" y1="38.5" x2="139" y2="38.5" stroke={ink} strokeWidth="1" />
          <circle cx="142" cy="38.5" r="1.4" fill={ink} />
          <line x1="93" y1="38.5" x2="81" y2="38.5" stroke={ink} strokeWidth="1" />
          <circle cx="78" cy="38.5" r="1.4" fill={ink} />
        </g>

        {/* policy：控制环 */}
        <g style={{ animation: "hxv-thumb-rise 3s ease-in-out infinite alternate" }}>
          <ellipse cx="110" cy="54" rx="27" ry="5" fill="none" stroke={ink} strokeWidth="1" />
          <ellipse cx="110" cy="60" rx="27" ry="5" fill="none" stroke={ink} strokeWidth="1" />
        </g>

        {/* memory：鼓形保险库（高亮） */}
        <g style={{ animation: "hxv-thumb-fall 3.4s ease-in-out infinite alternate" }}>
          <ellipse cx="110" cy="72" rx="21" ry="5" fill="none" stroke={accent} strokeWidth="1.4" />
          <ellipse cx="110" cy="88" rx="21" ry="5" fill="none" stroke={accent} strokeWidth="1.4" />
          <line x1="89" y1="72" x2="89" y2="88" stroke={accent} strokeWidth="1.4" />
          <line x1="131" y1="72" x2="131" y2="88" stroke={accent} strokeWidth="1.4" />
          <ellipse cx="110" cy="80" rx="21" ry="5" fill="none" stroke={accent} strokeWidth="0.7" opacity="0.7" />
          {/* 引线标注 */}
          <circle cx="131" cy="80" r="2.2" fill={accent} />
          <path d="M131 80 L152 68 L176 68" fill="none" stroke={accent} strokeWidth="1" />
          <text x="152" y="63" fontFamily="ui-monospace, monospace" fontSize="8" fill={accentText}>
            06 · MEMORY
          </text>
        </g>

        {/* tools：带端口的盒子 */}
        <g style={{ animation: "hxv-thumb-rise 3.8s ease-in-out infinite alternate" }}>
          <rect x="86" y="98" width="48" height="12" fill="none" stroke={ink} strokeWidth="1" />
          <line x1="134" y1="104" x2="143" y2="104" stroke={ink} strokeWidth="1" />
          <circle cx="146" cy="104" r="1.4" fill={ink} />
          <line x1="86" y1="104" x2="77" y2="104" stroke={ink} strokeWidth="1" />
          <circle cx="74" cy="104" r="1.4" fill={ink} />
        </g>

        {/* loop：发动机鼓 */}
        <g style={{ animation: "hxv-thumb-fall 3.2s ease-in-out infinite alternate" }}>
          <ellipse cx="110" cy="118" rx="25" ry="5" fill="none" stroke={ink} strokeWidth="1" />
          <ellipse cx="110" cy="132" rx="25" ry="5" fill="none" stroke={ink} strokeWidth="1" />
          <line x1="85" y1="118" x2="85" y2="132" stroke={ink} strokeWidth="1" />
          <line x1="135" y1="118" x2="135" y2="132" stroke={ink} strokeWidth="1" />
        </g>

        {/* provider：借用的喷嘴（虚线） */}
        <g style={{ animation: "hxv-thumb-rise 3.6s ease-in-out infinite alternate" }}>
          <line x1="99" y1="140" x2="89" y2="149" stroke={ink} strokeWidth="1" strokeDasharray="3 2.5" />
          <line x1="121" y1="140" x2="131" y2="149" stroke={ink} strokeWidth="1" strokeDasharray="3 2.5" />
        </g>

        {/* 角标 */}
        <text x="8" y="14" fontFamily="ui-monospace, monospace" fontSize="7" fill={grey}>
          A–A · EXPLODED
        </text>
        <text x="212" y="146" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="7" fill={grey}>
          HARNESS-001
        </text>
      </svg>
    </div>
  );
}
