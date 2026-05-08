export function ScanBorderThumb() {
  // 双层效果（与 demo 页 ScopedDemo 一致）：
  //   ① 内层 glow：4 条 linear-gradient mask 从每边向内 fade，做大气感
  //   ② 外层 ring：mask-composite: exclude 抠出 padding 那一圈，做 CodePen 同款锐利彩虹环
  // 两层共享同一个 conic-gradient 旋转节奏 —— 颜色变化对得上、不打架。
  const keyframes = `
    @keyframes scan-thumb-spin {
      to { transform: translate(-50%, -50%) rotate(360deg); }
    }
    @keyframes scan-thumb-breath {
      0%, 100% { opacity: 0.65; }
      50%      { opacity: 1; }
    }
  `;

  // 内层 glow 的 mask：4 条边向内 fade。缩略图小，直接用 px 让 4 边等宽。
  const glowFade = "12px";
  const glowMask = `
    linear-gradient(to top,    black, transparent ${glowFade}),
    linear-gradient(to bottom, black, transparent ${glowFade}),
    linear-gradient(to left,   black, transparent ${glowFade}),
    linear-gradient(to right,  black, transparent ${glowFade})
  `;

  // 外层 ring 的 mask：content-box 减 border-box，剩下 padding 那一圈
  const ringMask =
    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)";

  // 共享的 conic 彩虹：橙→金→青→蓝→紫，闭环回到橙
  const conic = `conic-gradient(from 0deg,
    #FF6B5C, #FF8A3D, #fbbf24, #34d399, #06b6d4, #4F8FFF, #a855f7, #FF6B5C)`;

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 60%, #0a0a12 0%, #050507 90%)",
      }}
    >
      <style>{keyframes}</style>

      {/* 内层 glow：大气感渐变，opacity 压低，放在底层 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          WebkitMask: glowMask,
          mask: glowMask,
          opacity: 0.55,
          animation: "scan-thumb-breath 2.6s ease-in-out infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "260%",
            height: "260%",
            transform: "translate(-50%, -50%)",
            background: conic,
            filter: "blur(14px) saturate(1.15)",
            animation: "scan-thumb-spin 5s linear infinite",
          }}
        />
      </div>

      {/* 外层 ring：CodePen 同款锐利彩虹环。padding=1.5px 决定环宽。 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "1.5px",
          WebkitMask: ringMask,
          mask: ringMask,
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "200%",
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
            background: conic,
            filter: "blur(2px) saturate(1.4)",
            animation: "scan-thumb-spin 5s linear infinite",
          }}
        />
      </div>

      {/* 中央内容暗示：白点 + 两条骨架行，表示"被扫描的页面" */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: "rgba(255,255,255,0.92)",
            boxShadow: "0 0 12px rgba(255,255,255,0.65)",
          }}
        />
        <div
          style={{
            width: "55%",
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.42)",
          }}
        />
        <div
          style={{
            width: "38%",
            height: 3,
            borderRadius: 2,
            background: "rgba(255,255,255,0.18)",
          }}
        />
      </div>
    </div>
  );
}
