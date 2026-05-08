export function LwcTerminalThumb() {
  // 三段式布局：左上候选 + 左下指标 + 右侧订单簿。
  // 用 absolute 定位三块小区域，呼应 Trading Terminal demo 的格局。
  const candles = [
    { up: true, top: 18, h: 6 },
    { up: false, top: 22, h: 8 },
    { up: false, top: 26, h: 10 },
    { up: true, top: 24, h: 6 },
    { up: true, top: 18, h: 8 },
    { up: true, top: 14, h: 6 },
    { up: false, top: 16, h: 8 },
    { up: true, top: 12, h: 6 },
  ];
  // 订单簿行：上 5 红 + mid + 下 5 绿
  const bookAsks = [
    { p: "248.65", w: 35 },
    { p: "248.60", w: 50 },
    { p: "248.55", w: 70 },
    { p: "248.50", w: 90 },
    { p: "248.45", w: 60 },
  ];
  const bookBids = [
    { p: "248.40", w: 80 },
    { p: "248.35", w: 50 },
    { p: "248.30", w: 35 },
    { p: "248.25", w: 25 },
    { p: "248.20", w: 18 },
  ];
  return (
    <div
      className="w-full h-full relative"
      style={{
        background:
          "linear-gradient(160deg, #06080d 0%, #0a0d14 60%, #06080d 100%)",
      }}
    >
      <style>{`
        @keyframes lwc-term-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* 顶部 ribbon */}
      <div
        style={{
          padding: "8px 10px 4px",
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontFamily: "monospace",
          fontSize: 8,
          letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: "#34d399",
            animation: "lwc-term-blink 1.4s ease-in-out infinite",
          }}
        />
        TERMINAL · L2
        <span
          style={{
            marginLeft: "auto",
            color: "rgba(255,255,255,0.85)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0,
          }}
        >
          $248.50
        </span>
      </div>

      {/* 主图 + 指标，左 70% */}
      <div
        style={{
          position: "absolute",
          left: 8,
          right: 84,
          top: 28,
          bottom: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {/* candles */}
        <svg
          viewBox="0 0 100 50"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "60%" }}
        >
          {/* BB 上轨 */}
          <path
            d="M0,10 L14,8 L28,10 L42,12 L56,14 L70,10 L84,6 L100,4"
            stroke="rgba(167,139,250,0.7)"
            strokeWidth={0.5}
            fill="none"
          />
          {/* BB 下轨 */}
          <path
            d="M0,38 L14,40 L28,42 L42,40 L56,36 L70,32 L84,28 L100,26"
            stroke="rgba(167,139,250,0.7)"
            strokeWidth={0.5}
            fill="none"
          />
          {/* candles */}
          {candles.map((c, i) => {
            const cx = 6 + i * 12;
            const color = c.up ? "#26a69a" : "#ef5350";
            return (
              <g key={i}>
                <line
                  x1={cx}
                  x2={cx}
                  y1={c.top - 2}
                  y2={c.top + c.h + 2}
                  stroke={color}
                  strokeWidth={0.6}
                />
                <rect
                  x={cx - 2.5}
                  y={c.top}
                  width={5}
                  height={c.h}
                  fill={color}
                />
              </g>
            );
          })}
        </svg>

        {/* 底部 MACD-ish histogram */}
        <svg
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "30%" }}
        >
          <line
            x1={0}
            x2={100}
            y1={10}
            y2={10}
            stroke="rgba(255,255,255,0.1)"
          />
          {[3, 5, -2, -4, -3, 2, 5, 6, 4, 2, -1, -3].map((v, i) => {
            const cx = 4 + i * 8;
            const color =
              v >= 0 ? "rgba(38,166,154,0.7)" : "rgba(239,83,80,0.7)";
            const top = v >= 0 ? 10 - v : 10;
            const h = Math.abs(v);
            return (
              <rect
                key={i}
                x={cx - 2}
                y={top}
                width={4}
                height={h}
                fill={color}
              />
            );
          })}
          {/* signal line */}
          <path
            d="M0,8 L10,9 L20,12 L30,13 L40,11 L50,8 L60,5 L70,7 L80,9 L90,11 L100,12"
            stroke="#60a5fa"
            strokeWidth={0.7}
            fill="none"
          />
          <path
            d="M0,11 L10,11 L20,12 L30,11 L40,9 L50,7 L60,4 L70,5 L80,7 L90,8 L100,9"
            stroke="#f59e0b"
            strokeWidth={0.7}
            fill="none"
          />
        </svg>
      </div>

      {/* 右侧订单簿，约 30% */}
      <div
        style={{
          position: "absolute",
          right: 6,
          top: 28,
          bottom: 8,
          width: 72,
          background: "rgba(255,255,255,0.02)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          padding: "4px 4px",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          fontFamily: "monospace",
          fontSize: 6,
        }}
      >
        {bookAsks.map((row, i) => (
          <div
            key={`a${i}`}
            style={{
              position: "relative",
              padding: "1px 3px",
              color: "#f87171",
              display: "flex",
              justifyContent: "space-between",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: `${row.w}%`,
                background: "rgba(239,83,80,0.18)",
              }}
            />
            <span style={{ position: "relative" }}>{row.p}</span>
            <span style={{ position: "relative", color: "#fca5a5" }}>
              {Math.round(row.w * 1.4)}
            </span>
          </div>
        ))}
        <div
          style={{
            margin: "2px 0",
            padding: "2px 3px",
            background: "rgba(38,166,154,0.1)",
            border: "1px solid rgba(38,166,154,0.3)",
            color: "#34d399",
            fontWeight: 700,
            display: "flex",
            justifyContent: "space-between",
            borderRadius: 2,
          }}
        >
          <span>▲248.45</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
            0.05
          </span>
        </div>
        {bookBids.map((row, i) => (
          <div
            key={`b${i}`}
            style={{
              position: "relative",
              padding: "1px 3px",
              color: "#34d399",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: `${row.w}%`,
                background: "rgba(38,166,154,0.18)",
              }}
            />
            <span style={{ position: "relative" }}>{row.p}</span>
            <span style={{ position: "relative", color: "#6ee7b7" }}>
              {Math.round(row.w * 1.4)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
