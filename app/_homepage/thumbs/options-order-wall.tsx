export function OptionsOrderWallThumb() {
  // 伪等轴 3D 柱阵：两排（前 Put 红 / 后 Call 绿），一根琥珀描边的大单墙发光脉冲。
  const backRow = [10, 16, 24, 34, 52, 40, 28, 18, 12]; // Call，绿
  const frontRow = [14, 22, 32, 46, 30, 22, 60, 14, 10]; // Put，红（idx 6 是墙）
  const wallIdx = 6;
  const barW = 8;
  const gap = 13;
  const x0 = 10;
  const skew = 5; // 等轴偏移

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background: "linear-gradient(155deg, #060911 0%, #0a1020 55%, #05070c 100%)",
      }}
    >
      <style>{`
        @keyframes oow-wall-pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* 顶部小标签 */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 10,
          fontFamily: "monospace",
          fontSize: 8,
          letterSpacing: "0.14em",
          color: "rgba(255,255,255,0.45)",
        }}
      >
        OPTIONS · OPEN INTEREST
        <span style={{ color: "#ffc24b", marginLeft: 6 }}>▮ WALL</span>
      </div>

      <svg viewBox="0 0 140 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {/* 地面透视网格 */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={`g${i}`}
            x1={0}
            y1={68 + i * 9}
            x2={140}
            y2={64 + i * 9}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={0.6}
          />
        ))}

        {/* 现价参考平面（半透明蓝） */}
        <polygon
          points="72,18 82,14 82,88 72,92"
          fill="rgba(122,162,255,0.10)"
          stroke="rgba(122,162,255,0.35)"
          strokeWidth={0.5}
        />

        {/* 后排：Call 绿柱（带等轴顶面） */}
        {backRow.map((h, i) => {
          const x = x0 + i * gap + skew;
          const y = 78 - h;
          return (
            <g key={`c${i}`}>
              <rect x={x} y={y} width={barW} height={h} fill="rgba(46,230,201,0.55)" />
              <polygon
                points={`${x},${y} ${x + 3},${y - 2.4} ${x + barW + 3},${y - 2.4} ${x + barW},${y}`}
                fill="rgba(46,230,201,0.85)"
              />
            </g>
          );
        })}

        {/* 前排：Put 红柱 */}
        {frontRow.map((h, i) => {
          const x = x0 + i * gap;
          const y = 86 - h;
          const isWall = i === wallIdx;
          return (
            <g key={`p${i}`}>
              {isWall && (
                <rect
                  x={x - 4}
                  y={y - 6}
                  width={barW + 8}
                  height={h + 10}
                  rx={3}
                  fill="rgba(255,194,75,0.16)"
                  style={{ animation: "oow-wall-pulse 1.8s ease-in-out infinite" }}
                />
              )}
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                fill={isWall ? "rgba(255,101,92,0.95)" : "rgba(255,101,92,0.6)"}
                stroke={isWall ? "#ffc24b" : "none"}
                strokeWidth={isWall ? 1 : 0}
              />
              <polygon
                points={`${x},${y} ${x + 3},${y - 2.4} ${x + barW + 3},${y - 2.4} ${x + barW},${y}`}
                fill={isWall ? "#ff8a80" : "rgba(255,101,92,0.85)"}
                stroke={isWall ? "#ffc24b" : "none"}
                strokeWidth={isWall ? 0.8 : 0}
              />
              {isWall && (
                <text
                  x={x + barW / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize={7}
                  fontFamily="monospace"
                  fontWeight={700}
                  fill="#ffd88a"
                >
                  1.4M
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
