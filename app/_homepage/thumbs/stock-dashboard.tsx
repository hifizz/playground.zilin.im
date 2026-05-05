export function StockDashboardThumb() {
  // 缩略图必须纯静态展示，不依赖 use client。
  // 抽象一组迷你蜡烛 + 价格大字头部，传达"股价 dashboard"的视觉感。
  // 蜡烛布局：12 根，模拟 V 形走势（先跌后涨）。涨绿跌红。
  const candles: { up: boolean; bodyTop: number; bodyHeight: number; wickTop: number; wickHeight: number }[] = [
    { up: true,  bodyTop: 28, bodyHeight: 8,  wickTop: 24, wickHeight: 16 },
    { up: false, bodyTop: 30, bodyHeight: 10, wickTop: 26, wickHeight: 18 },
    { up: false, bodyTop: 34, bodyHeight: 14, wickTop: 30, wickHeight: 22 },
    { up: false, bodyTop: 40, bodyHeight: 18, wickTop: 36, wickHeight: 26 },
    { up: false, bodyTop: 46, bodyHeight: 14, wickTop: 42, wickHeight: 22 },
    { up: true,  bodyTop: 44, bodyHeight: 12, wickTop: 40, wickHeight: 20 },
    { up: true,  bodyTop: 38, bodyHeight: 14, wickTop: 34, wickHeight: 22 },
    { up: true,  bodyTop: 32, bodyHeight: 12, wickTop: 28, wickHeight: 20 },
    { up: true,  bodyTop: 26, bodyHeight: 10, wickTop: 22, wickHeight: 18 },
    { up: true,  bodyTop: 20, bodyHeight: 8,  wickTop: 16, wickHeight: 16 },
    { up: false, bodyTop: 18, bodyHeight: 6,  wickTop: 14, wickHeight: 14 },
    { up: true,  bodyTop: 14, bodyHeight: 8,  wickTop: 10, wickHeight: 16 },
  ];

  return (
    <div
      className="w-full h-full flex flex-col justify-between"
      style={{
        background: "linear-gradient(160deg, #08090c 0%, #0d1015 60%, #0a0c10 100%)",
        padding: "16px 20px",
      }}
    >
      <style>{`
        @keyframes stock-thumb-pulse {
          0%, 100% { opacity: 0.95; }
          50% { opacity: 0.6; }
        }
      `}</style>

      {/* 顶部：股价 + 涨幅 */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "rgba(255,255,255,0.92)",
            fontFamily: "monospace",
          }}
        >
          $544
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            padding: "1px 5px",
            borderRadius: 3,
            background: "rgba(34,197,94,0.16)",
            border: "1px solid rgba(34,197,94,0.3)",
            fontSize: 9,
            fontWeight: 600,
            color: "#4ade80",
            fontFamily: "monospace",
          }}
        >
          ▲ 2.66%
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 8,
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.32)",
            fontFamily: "monospace",
          }}
        >
          SNDK
        </span>
      </div>

      {/* 蜡烛图 */}
      <svg
        viewBox="0 0 200 70"
        preserveAspectRatio="none"
        style={{ width: "100%", height: 70 }}
      >
        {/* 中间参考虚线 */}
        <line
          x1={0}
          x2={200}
          y1={36}
          y2={36}
          stroke="rgba(255,255,255,0.08)"
          strokeDasharray="2 3"
        />
        {candles.map((c, i) => {
          const cx = 8 + i * 16;
          const color = c.up ? "#22c55e" : "#ef4444";
          return (
            <g key={i}>
              {/* 影线 */}
              <line
                x1={cx}
                x2={cx}
                y1={c.wickTop}
                y2={c.wickTop + c.wickHeight}
                stroke={color}
                strokeWidth={1}
                opacity={0.85}
              />
              {/* 实体 */}
              <rect
                x={cx - 3}
                y={c.bodyTop}
                width={6}
                height={c.bodyHeight}
                fill={color}
                opacity={0.92}
              />
            </g>
          );
        })}
        {/* 最末根带 pulse 圆点 */}
        <circle
          cx={8 + 11 * 16}
          cy={14}
          r={2.2}
          fill="#4ade80"
          style={{ animation: "stock-thumb-pulse 1.6s ease-in-out infinite" }}
        />
      </svg>
    </div>
  );
}
