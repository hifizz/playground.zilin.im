// 静态缩略图：迷你深色卡片画廊 —— donut + area spark + bar grid
export function MebiusChartsThumb() {
  const spark = "M0,26 L10,24 L20,25 L30,20 L40,21 L50,16 L60,17 L70,11 L80,8";
  const sparkArea = spark + " L80,32 L0,32 Z";
  const bars = [10, 16, 12, 20, 15, 24, 18, 26, 21, 28];

  return (
    <div
      className="w-full h-full"
      style={{
        background:
          "linear-gradient(160deg, #0b0e18 0%, #101526 55%, #080b12 100%)",
        padding: "12px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        gap: 8,
      }}
    >
      {/* 顶部光晕 */}
      <div
        style={{
          position: "absolute",
          top: -40,
          left: "20%",
          width: 160,
          height: 80,
          background:
            "radial-gradient(closest-side, rgba(46,125,246,0.25), transparent)",
          filter: "blur(6px)",
        }}
      />

      {/* donut card */}
      <div
        style={{
          flex: "0 0 40%",
          borderRadius: 8,
          background: "linear-gradient(#151724,#101220)",
          border: "1px solid rgba(255,255,255,0.07)",
          padding: 7,
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: 99,
              background: "#2e7df6",
              boxShadow: "0 0 5px #2e7df6",
            }}
          />
          <span
            style={{
              height: 3,
              width: 26,
              borderRadius: 2,
              background: "rgba(255,255,255,0.25)",
            }}
          />
        </div>
        <svg viewBox="0 0 60 60" style={{ flex: 1, width: "100%" }}>
          {[
            { c: "#2e7df6", a0: -90, a1: 90 },
            { c: "#7fb3f9", a0: 95, a1: 150 },
            { c: "#f97316", a0: 155, a1: 200 },
            { c: "#a855f7", a0: 205, a1: 262 },
          ].map((s, i) => (
            <circle
              key={i}
              cx="30"
              cy="30"
              r="20"
              fill="none"
              stroke={s.c}
              strokeWidth="9"
              strokeDasharray={`${((s.a1 - s.a0) / 360) * 125.6} 125.6`}
              transform={`rotate(${s.a0} 30 30)`}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div style={{ display: "flex", gap: 4 }}>
          {["#2e7df6", "#7fb3f9", "#f97316", "#a855f7"].map((c) => (
            <span
              key={c}
              style={{
                width: 4,
                height: 4,
                borderRadius: 99,
                background: c,
              }}
            />
          ))}
        </div>
      </div>

      {/* 右侧两张小卡 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* area spark card */}
        <div
          style={{
            flex: 1,
            borderRadius: 8,
            background: "linear-gradient(#151724,#101220)",
            border: "1px solid rgba(255,255,255,0.07)",
            padding: 7,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              height: 4,
              width: 30,
              borderRadius: 2,
              background: "rgba(255,255,255,0.3)",
            }}
          />
          <svg
            viewBox="0 0 80 32"
            preserveAspectRatio="none"
            style={{ flex: 1, width: "100%" }}
          >
            <defs>
              <linearGradient id="mb-spark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={sparkArea} fill="url(#mb-spark)" />
            <path
              d={spark}
              stroke="#22c55e"
              strokeWidth={1.4}
              fill="none"
            />
          </svg>
        </div>

        {/* bars card */}
        <div
          style={{
            flex: 1,
            borderRadius: 8,
            background: "linear-gradient(#151724,#101220)",
            border: "1px solid rgba(255,255,255,0.07)",
            padding: 7,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              height: 4,
              width: 22,
              borderRadius: 2,
              background: "rgba(255,255,255,0.3)",
            }}
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "flex-end",
              gap: 3,
            }}
          >
            {bars.map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${(h / 28) * 100}%`,
                  borderRadius: 2,
                  background:
                    i === bars.length - 1
                      ? "#2e7df6"
                      : "rgba(255,255,255,0.16)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
