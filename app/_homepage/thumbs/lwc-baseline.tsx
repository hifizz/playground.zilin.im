export function LwcBaselineThumb() {
  // Baseline series：上半绿、下半红，中间一条 cost basis 虚线。
  const linePath =
    "M0,38 L18,30 L36,42 L54,50 L72,62 L90,58 L108,46 L126,52 L144,40 L162,28 L180,22 L200,18";
  const basisY = 50;
  const fillTop = `${linePath} L200,${basisY} L0,${basisY} Z`;
  const fillBottom = `${linePath} L200,${basisY} L0,${basisY} Z`;
  return (
    <div
      className="w-full h-full"
      style={{
        background:
          "linear-gradient(160deg, #060810 0%, #0c1018 60%, #07090f 100%)",
        padding: "12px 14px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 11,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.12em",
        }}
      >
        BASELINE · P&amp;L
      </div>
      <svg
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "70%",
        }}
      >
        <defs>
          <clipPath id="lwc-base-top">
            <rect x={0} y={0} width={200} height={basisY} />
          </clipPath>
          <clipPath id="lwc-base-bottom">
            <rect x={0} y={basisY} width={200} height={80 - basisY} />
          </clipPath>
          <linearGradient id="lwc-base-up" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#26a69a" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#26a69a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="lwc-base-dn" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ef5350" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#ef5350" stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* 上半填充（绿） */}
        <g clipPath="url(#lwc-base-top)">
          <path d={fillTop} fill="url(#lwc-base-up)" />
        </g>
        {/* 下半填充（红） */}
        <g clipPath="url(#lwc-base-bottom)">
          <path d={fillBottom} fill="url(#lwc-base-dn)" />
        </g>
        {/* basis 线 */}
        <line
          x1={0}
          x2={200}
          y1={basisY}
          y2={basisY}
          stroke="rgba(255,255,255,0.45)"
          strokeDasharray="4 3"
          strokeWidth={0.8}
        />
        {/* 主线 */}
        <g clipPath="url(#lwc-base-top)">
          <path
            d={linePath}
            stroke="#26a69a"
            strokeWidth={1.6}
            fill="none"
          />
        </g>
        <g clipPath="url(#lwc-base-bottom)">
          <path
            d={linePath}
            stroke="#ef5350"
            strokeWidth={1.6}
            fill="none"
          />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          padding: "1px 6px",
          borderRadius: 3,
          background: "rgba(38,166,154,0.18)",
          border: "1px solid rgba(38,166,154,0.32)",
          color: "#5eead4",
          fontSize: 9,
          fontFamily: "monospace",
        }}
      >
        +12.4%
      </div>
    </div>
  );
}
