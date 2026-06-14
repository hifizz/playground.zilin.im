export function ReavizBlockMultiThumb() {
  // 复刻 reaviz Multi Series · Medium block 的视觉提示：
  // 顶部 "Incident Report" 标题条 + 三色 area 图 + 底部数字 KPI。
  const colors = ["#4C86FF", "#40D3F4", "#9152EE"];
  const paths = [
    "M0,52 L20,48 L40,58 L60,50 L80,44 L100,52 L120,46 L140,40 L160,46 L180,38 L200,42",
    "M0,60 L20,56 L40,52 L60,58 L80,50 L100,46 L120,52 L140,44 L160,40 L180,46 L200,38",
    "M0,66 L20,62 L40,68 L60,60 L80,64 L100,56 L120,62 L140,54 L160,58 L180,50 L200,52",
  ];
  return (
    <div
      className="w-full h-full flex flex-col"
      style={{
        background: "#000",
        padding: "10px 12px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          Incident Report
        </span>
        <span
          style={{
            background: "#262631",
            color: "#fff",
            fontSize: 8,
            padding: "2px 5px",
            borderRadius: 3,
            fontFamily: "monospace",
          }}
        >
          7d ▾
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
        {[
          { c: "#4C86FF", l: "DLP" },
          { c: "#40D3F4", l: "Threat" },
          { c: "#9152EE", l: "SysLog" },
        ].map((it) => (
          <span
            key={it.c}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: 8,
              color: "#9A9AAF",
              fontFamily: "monospace",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                background: it.c,
              }}
            />
            {it.l}
          </span>
        ))}
      </div>
      <svg
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        style={{ width: "100%", flex: 1 }}
      >
        <defs>
          {colors.map((c, i) => (
            <linearGradient
              id={`rz-blk-${i}`}
              key={c}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={c} stopOpacity={0} />
              <stop offset="100%" stopColor={c} stopOpacity={0.4} />
            </linearGradient>
          ))}
        </defs>
        {/* gridlines */}
        {[20, 40, 60].map((y) => (
          <line
            key={y}
            x1={0}
            x2={200}
            y1={y}
            y2={y}
            stroke="#7E7E8F75"
            strokeWidth={0.5}
          />
        ))}
        {paths.map((d, i) => (
          <g key={i}>
            <path
              d={`${d} L200,80 L0,80 Z`}
              fill={`url(#rz-blk-${i})`}
            />
            <path
              d={d}
              stroke={colors[i]}
              strokeWidth={1.2}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            321
          </span>
          <span
            style={{
              fontSize: 8,
              padding: "1px 4px",
              borderRadius: 8,
              color: "#F08083",
              background: "rgba(232,64,69,0.4)",
              fontFamily: "monospace",
            }}
          >
            ▲12%
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            1.12k
          </span>
          <span
            style={{
              fontSize: 8,
              padding: "1px 4px",
              borderRadius: 8,
              color: "#40E5D1",
              background: "rgba(64,229,209,0.4)",
              fontFamily: "monospace",
            }}
          >
            ▼4%
          </span>
        </div>
      </div>
    </div>
  );
}
