export function ReavizStockCompareThumb() {
  // 5 条归一化线交叉对比，模拟 reaviz LineChart multi-series。
  const lines = [
    { d: "M0,70 L25,62 L50,52 L75,40 L100,32 L130,22 L160,18 L200,10", color: "#76b900" }, // NVDA
    { d: "M0,72 L30,70 L60,68 L90,72 L120,60 L150,58 L180,50 L200,48", color: "#a3a3a3" }, // AAPL
    { d: "M0,68 L25,72 L55,60 L80,68 L110,46 L140,58 L170,40 L200,34", color: "#e31937" }, // TSLA
    { d: "M0,74 L30,66 L60,72 L90,58 L120,68 L150,52 L180,60 L200,46", color: "#1877f2" }, // META
    { d: "M0,70 L30,72 L60,66 L90,64 L120,56 L150,60 L180,52 L200,42", color: "#fbbc04" }, // GOOG
  ];
  return (
    <div
      className="w-full h-full"
      style={{
        background:
          "linear-gradient(160deg, #07090d 0%, #0a1018 60%, #060810 100%)",
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
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.12em",
          }}
        >
          COMPARE · 5 TICKERS
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "monospace",
            fontSize: 9,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          3M
        </span>
      </div>
      <svg
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "82%", marginTop: 4 }}
      >
        {/* baseline 0% */}
        <line x1={0} x2={200} y1={70} y2={70} stroke="rgba(255,255,255,0.12)" strokeDasharray="2 3" />
        {/* gridlines */}
        {[20, 45, 95].map((y) => (
          <line key={y} x1={0} x2={200} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" />
        ))}
        {lines.map((l) => (
          <path
            key={l.color}
            d={l.d}
            stroke={l.color}
            strokeWidth={1.4}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: 6,
          left: 12,
          right: 12,
          display: "flex",
          gap: 6,
        }}
      >
        {lines.map((l) => (
          <span
            key={l.color}
            style={{
              flex: 1,
              height: 2,
              borderRadius: 1,
              background: l.color,
              opacity: 0.85,
            }}
          />
        ))}
      </div>
    </div>
  );
}
