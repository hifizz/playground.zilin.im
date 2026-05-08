export function LwcAreaGlowThumb() {
  // 单 series 渐变 area，TradingView 首页 hero 同款视觉。
  const path = "M0,72 L20,68 L40,60 L60,64 L80,52 L100,48 L120,38 L140,42 L160,28 L180,22 L200,18";
  const area =
    path + " L200,100 L0,100 Z";
  return (
    <div
      className="w-full h-full"
      style={{
        background:
          "linear-gradient(160deg, #050714 0%, #0a1428 60%, #060812 100%)",
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
          marginBottom: 4,
        }}
      >
        AREA · GRADIENT
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 18,
          color: "rgba(255,255,255,0.92)",
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        $642.18
      </div>
      <svg
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <defs>
          <linearGradient id="lwc-area-glow-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <filter id="lwc-area-glow-blur">
            <feGaussianBlur stdDeviation={1.2} />
          </filter>
        </defs>
        <path d={area} fill="url(#lwc-area-glow-fill)" />
        <path
          d={path}
          stroke="#3b82f6"
          strokeWidth={1.6}
          fill="none"
          filter="url(#lwc-area-glow-blur)"
          opacity={0.6}
        />
        <path d={path} stroke="#60a5fa" strokeWidth={1.4} fill="none" />
        <circle cx={200} cy={18} r={2.6} fill="#fff" />
        <circle
          cx={200}
          cy={18}
          r={5}
          fill="none"
          stroke="#60a5fa"
          strokeWidth={1.2}
          opacity={0.6}
        />
      </svg>
      {/* 色板小点 */}
      <div
        style={{
          position: "absolute",
          right: 12,
          top: 12,
          display: "flex",
          gap: 4,
        }}
      >
        {["#3b82f6", "#a78bfa", "#34d399", "#f59e0b"].map((c) => (
          <span
            key={c}
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: c,
              opacity: c === "#3b82f6" ? 1 : 0.4,
            }}
          />
        ))}
      </div>
    </div>
  );
}
