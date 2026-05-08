export function LwcCandleVolumeThumb() {
  // 顶部蜡烛 + 底部成交量直方图，呼应 "Candle + Volume" demo 的双 pane 结构。
  const candles = [
    { up: true, top: 22, h: 8, wt: 18, wh: 16 },
    { up: true, top: 18, h: 10, wt: 14, wh: 18 },
    { up: false, top: 14, h: 12, wt: 10, wh: 22 },
    { up: false, top: 18, h: 14, wt: 14, wh: 22 },
    { up: true, top: 24, h: 8, wt: 20, wh: 16 },
    { up: true, top: 20, h: 10, wt: 16, wh: 18 },
    { up: false, top: 22, h: 12, wt: 18, wh: 20 },
    { up: true, top: 18, h: 14, wt: 14, wh: 22 },
    { up: true, top: 14, h: 10, wt: 10, wh: 18 },
    { up: true, top: 10, h: 8, wt: 6, wh: 16 },
  ];
  const vols = [10, 14, 18, 22, 12, 16, 24, 20, 14, 10];
  return (
    <div
      className="w-full h-full flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, #07090d 0%, #0c1118 60%, #080a0f 100%)",
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.12em",
          }}
        >
          OHLC + VOL
        </span>
        <span
          style={{
            marginLeft: "auto",
            padding: "1px 5px",
            borderRadius: 3,
            background: "rgba(38,166,154,0.18)",
            border: "1px solid rgba(38,166,154,0.32)",
            color: "#5eead4",
            fontSize: 9,
            fontFamily: "monospace",
          }}
        >
          ▲ 1.84%
        </span>
      </div>
      <svg
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        style={{ width: "100%", flex: 1 }}
      >
        <line
          x1={0}
          x2={200}
          y1={70}
          y2={70}
          stroke="rgba(255,255,255,0.06)"
        />
        {/* 蜡烛 */}
        {candles.map((c, i) => {
          const cx = 12 + i * 19;
          const color = c.up ? "#26a69a" : "#ef5350";
          return (
            <g key={i}>
              <line
                x1={cx}
                x2={cx}
                y1={c.wt}
                y2={c.wt + c.wh}
                stroke={color}
                strokeWidth={1}
              />
              <rect
                x={cx - 4}
                y={c.top}
                width={8}
                height={c.h}
                fill={color}
              />
            </g>
          );
        })}
        {/* 成交量 histogram */}
        {vols.map((v, i) => {
          const cx = 12 + i * 19;
          const color =
            candles[i].up ? "rgba(38,166,154,0.55)" : "rgba(239,83,80,0.55)";
          return (
            <rect
              key={i}
              x={cx - 5}
              y={100 - v}
              width={10}
              height={v}
              fill={color}
            />
          );
        })}
      </svg>
    </div>
  );
}
