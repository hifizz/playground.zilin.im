export function ReavizSaasMetricsThumb() {
  // 顶部 KPI 数字 + sparkline，底部多色 stacked bars。
  const bars = [
    [4, 5, 7, 8],
    [5, 6, 7, 9],
    [4, 6, 9, 8],
    [5, 7, 8, 10],
    [6, 8, 9, 11],
    [6, 8, 10, 12],
    [7, 9, 11, 12],
  ];
  const tiers = ["#475569", "#3b82f6", "#8b5cf6", "#22c55e"];
  const spark = "M0,18 L10,16 L20,17 L30,14 L40,12 L50,13 L60,9 L70,8 L80,6";
  const sparkArea = spark + " L80,24 L0,24 Z";

  return (
    <div
      className="w-full h-full"
      style={{
        background:
          "linear-gradient(160deg, #07101a 0%, #0a1a2a 60%, #060d15 100%)",
        padding: "10px 12px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 10,
          color: "rgba(125,211,252,0.85)",
          letterSpacing: "0.12em",
        }}
      >
        SAAS · DASHBOARD
      </div>

      {/* KPI 行 */}
      <div style={{ display: "flex", gap: 6 }}>
        {[
          { v: "$32k", c: "#22c55e" },
          { v: "108%", c: "#3b82f6" },
        ].map((k, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: 4,
              background: "rgba(255,255,255,0.03)",
              padding: "4px 6px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: "rgba(255,255,255,0.92)",
                fontWeight: 600,
              }}
            >
              {k.v}
            </span>
            <svg viewBox="0 0 80 24" preserveAspectRatio="none" style={{ width: "100%", height: 18 }}>
              <defs>
                <linearGradient id={`rz-spk-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={k.c} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={k.c} stopOpacity={0} />
                </linearGradient>
              </defs>
              <path d={sparkArea} fill={`url(#rz-spk-${i})`} />
              <path d={spark} stroke={k.c} strokeWidth={1.2} fill="none" />
            </svg>
          </div>
        ))}
      </div>

      {/* MRR stacked bars */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 4 }}>
        {bars.map((stack, i) => {
          const total = stack.reduce((a, b) => a + b, 0);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${(total / 40) * 100}%`,
                display: "flex",
                flexDirection: "column-reverse",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              {stack.map((h, j) => (
                <div
                  key={j}
                  style={{
                    height: `${(h / total) * 100}%`,
                    background: tiers[j],
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
