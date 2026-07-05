export function SolarSystemPointsThumb() {
  // 纯 CSS 静态缩略图（不挂 WebGL）：点阵化的太阳 + 虚线轨道 + 粒子团行星，
  // 暗示"一切皆点云"。太阳用 radial-gradient 点阵纹理，行星是散布小圆点簇。
  const keyframes = `
    @keyframes solar-pts-orbit {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes solar-pts-twinkle {
      0%, 100% { opacity: 0.55; }
      50%      { opacity: 1; }
    }
  `;

  // 每颗"行星"是一小簇粒子：中心点 + 环绕的小点
  const cluster = (color: string, size: number) => (
    <div style={{ position: "relative", width: size, height: size }}>
      {[
        [50, 50, 0.45], [22, 38, 0.28], [70, 26, 0.24], [76, 62, 0.26],
        [38, 74, 0.24], [58, 78, 0.2], [30, 18, 0.18],
      ].map(([x, y, s], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            width: size * (s as number),
            height: size * (s as number),
            borderRadius: "50%",
            background: color,
            transform: "translate(-50%, -50%)",
            boxShadow: `0 0 3px ${color}`,
            animation: `solar-pts-twinkle ${1.6 + i * 0.3}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );

  const orbits = [
    { r: 34, size: 8, color: "#60a5fa", dur: 9, from: 130 },
    { r: 52, size: 9, color: "#f87171", dur: 13, from: 300 },
    { r: 72, size: 13, color: "#d4a373", dur: 19, from: 60 },
  ];

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 20% 50%, #0c1428 0%, #060810 55%, #030308 100%)",
      }}
    >
      <style>{keyframes}</style>

      {/* 点阵太阳：径向渐变球上叠 dotted 网格，暗示粒子构成 */}
      <div
        style={{
          position: "absolute",
          left: "-12%",
          top: "50%",
          width: "32%",
          aspectRatio: "1",
          transform: "translateY(-50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 55% 45%, rgba(255,236,170,0.95), rgba(255,160,60,0.85) 55%, rgba(220,90,30,0.6) 85%)",
          WebkitMaskImage:
            "radial-gradient(circle, #000 1px, transparent 1.4px)",
          WebkitMaskSize: "5px 5px",
          maskImage: "radial-gradient(circle, #000 1px, transparent 1.4px)",
          maskSize: "5px 5px",
          boxShadow: "0 0 36px 10px rgba(255,160,60,0.35)",
        }}
      />

      {/* 虚线轨道 + 粒子团行星 */}
      {orbits.map((o, i) => (
        <div key={i}>
          <div
            style={{
              position: "absolute",
              left: "4%",
              top: "50%",
              width: `${o.r * 1.5}%`,
              aspectRatio: "1",
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              border: "1.2px dotted rgba(150,170,220,0.3)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "4%",
              top: "50%",
              width: `${o.r * 1.5}%`,
              aspectRatio: "1",
              transform: "translate(-50%, -50%)",
              animation: `solar-pts-orbit ${o.dur}s linear infinite`,
              animationDelay: `-${(o.from / 360) * o.dur}s`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                transform: "translate(-50%, -50%)",
              }}
            >
              {cluster(o.color, o.size)}
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
          color: "rgba(147,197,253,0.75)",
        }}
      >
        POINT CLOUD
      </div>
    </div>
  );
}
