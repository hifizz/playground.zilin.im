export function SolarSystemThumb() {
  // 纯 CSS 静态缩略图（不挂 WebGL）：深空底 + 左侧太阳辉光 + 同心轨道环，
  // 几颗行星沿各自轨道以不同周期公转（暗示"每颗星球有自己的旋转参数"）。
  const keyframes = `
    @keyframes solar-thumb-orbit {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes solar-thumb-sun {
      0%, 100% { opacity: 0.8; }
      50%      { opacity: 1; }
    }
  `;

  // 轨道半径(%) / 行星尺寸(px) / 颜色 / 周期(s)
  const orbits = [
    { r: 30, size: 4, color: "#a8a29e", dur: 6, from: 40 },
    { r: 44, size: 6, color: "#60a5fa", dur: 10, from: 160 },
    { r: 58, size: 5, color: "#f87171", dur: 14, from: 260 },
    { r: 74, size: 9, color: "#d4a373", dur: 20, from: 90, ring: true },
  ];

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 18% 50%, #1a1030 0%, #070714 55%, #030308 100%)",
      }}
    >
      <style>{keyframes}</style>

      {/* 星点 */}
      {[
        [78, 18], [88, 62], [62, 12], [70, 82], [92, 30], [55, 70], [82, 44],
      ].map(([x, y], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            width: 2,
            height: 2,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.7)",
            opacity: 0.3 + (i % 3) * 0.25,
          }}
        />
      ))}

      {/* 太阳（左侧半露 + 辉光呼吸） */}
      <div
        style={{
          position: "absolute",
          left: "-14%",
          top: "50%",
          width: "34%",
          aspectRatio: "1",
          transform: "translateY(-50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle at 60% 45%, #fff3c4, #ffb545 45%, #f4691f 80%)",
          boxShadow: "0 0 40px 14px rgba(255,160,60,0.45)",
          animation: "solar-thumb-sun 3s ease-in-out infinite",
        }}
      />

      {/* 轨道 + 行星 */}
      {orbits.map((o, i) => (
        <div key={i}>
          <div
            style={{
              position: "absolute",
              left: "2%",
              top: "50%",
              width: `${o.r * 1.5}%`,
              aspectRatio: "1",
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              border: "1px solid rgba(150,170,220,0.18)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "2%",
              top: "50%",
              width: `${o.r * 1.5}%`,
              aspectRatio: "1",
              transform: "translate(-50%, -50%)",
              animation: `solar-thumb-orbit ${o.dur}s linear infinite`,
              animationDelay: `-${(o.from / 360) * o.dur}s`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                transform: "translate(-50%, -50%)",
                width: o.size,
                height: o.size,
                borderRadius: "50%",
                background: o.color,
                boxShadow: `0 0 6px ${o.color}aa`,
              }}
            >
              {o.ring && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: o.size * 2.2,
                    height: o.size * 0.9,
                    transform: "translate(-50%, -50%) rotate(-24deg)",
                    borderRadius: "50%",
                    border: "1px solid rgba(231,207,159,0.75)",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      ))}

      {/* 角标文字 */}
      <div
        style={{
          position: "absolute",
          right: 12,
          top: 10,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 10,
          letterSpacing: "0.25em",
          color: "rgba(196,181,253,0.75)",
        }}
      >
        SOLAR 3D
      </div>
    </div>
  );
}
