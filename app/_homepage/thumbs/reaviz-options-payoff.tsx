export function ReavizOptionsPayoffThumb() {
  // 长 Call 收益曲线：水平 0 线 + 拐点在 strike + 右上无限上涨。
  // 区域分上下两半：上方绿，下方红。
  const zeroY = 60;
  // payoff path: flat below strike, kinks at x=100 (strike), rises
  const linePath = "M0,72 L70,72 L110,72 L200,18";
  const areaPath = linePath + ` L200,${zeroY} L0,${zeroY} Z`;
  return (
    <div
      className="w-full h-full"
      style={{
        background:
          "linear-gradient(160deg, #0c081a 0%, #150d28 60%, #0a0613 100%)",
        padding: "10px 12px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            color: "rgba(196,181,253,0.7)",
            letterSpacing: "0.12em",
          }}
        >
          OPTIONS · P&L
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "monospace",
            fontSize: 9,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          LONG CALL
        </span>
      </div>
      <svg
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "82%", marginTop: 4 }}
      >
        <defs>
          {/* 上半绿色，下半红色 */}
          <linearGradient id="rz-payoff" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.55} />
            <stop offset={`${zeroY}%`} stopColor="#22c55e" stopOpacity={0.08} />
            <stop offset={`${zeroY}%`} stopColor="#ef4444" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.55} />
          </linearGradient>
        </defs>
        {/* 零轴 */}
        <line x1={0} x2={200} y1={zeroY} y2={zeroY} stroke="rgba(255,255,255,0.35)" />
        {/* strike vertical */}
        <line x1={110} x2={110} y1={4} y2={96} stroke="rgba(139,92,246,0.6)" strokeDasharray="3 3" />
        {/* breakeven vertical */}
        <line x1={132} x2={132} y1={4} y2={96} stroke="rgba(250,204,21,0.55)" strokeDasharray="2 3" />
        {/* payoff fill */}
        <path d={areaPath} fill="url(#rz-payoff)" />
        {/* payoff line */}
        <path
          d={linePath}
          stroke="#e5e7eb"
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: 6,
          left: 12,
          display: "flex",
          gap: 8,
          fontFamily: "monospace",
          fontSize: 9,
          color: "rgba(255,255,255,0.45)",
        }}
      >
        <span><span style={{ color: "#a78bfa" }}>K</span> $182</span>
        <span><span style={{ color: "#facc15" }}>BE</span> $187</span>
      </div>
    </div>
  );
}
