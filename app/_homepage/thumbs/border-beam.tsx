export function BorderBeamThumb() {
  // 缩略图必须是纯静态展示，不依赖 use client。
  // 这里用旋转 conic-gradient 实现 border-beam 的同款"绕行光斑"效果，
  // 只用 CSS 动画就能跑（首页 server-rendered 也能动）。
  const keyframes = `
    @keyframes border-beam-thumb-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes border-beam-thumb-spin-rev {
      from { transform: rotate(0deg); }
      to   { transform: rotate(-360deg); }
    }
  `;

  // 关键：双层 mask 把 padding 那圈外的内容裁掉，只剩描边
  const ringMask =
    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)";

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: "linear-gradient(160deg, #0a0a12 0%, #15101f 60%, #0c0c14 100%)",
      }}
    >
      <style>{keyframes}</style>

      {/* 卡片 */}
      <div
        style={{
          position: "relative",
          width: "70%",
          height: "55%",
          borderRadius: 12,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: 12,
        }}
      >
        {/* 内部内容 */}
        <div
          style={{
            width: "70%",
            height: 4,
            borderRadius: 2,
            background: "rgba(255,255,255,0.4)",
            marginBottom: 6,
          }}
        />
        <div
          style={{
            width: "45%",
            height: 3,
            borderRadius: 2,
            background: "rgba(255,255,255,0.18)",
          }}
        />

        {/* Beam 1 (顺时针) —— 绝对定位铺满，外层用 mask 抠出描边那圈 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            padding: 1.5,
            WebkitMask: ringMask,
            mask: ringMask,
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              background:
                "conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #ffaa40 330deg, #9c40ff 355deg, transparent 360deg)",
              animation: "border-beam-thumb-spin 4s linear infinite",
            }}
          />
        </div>

        {/* Beam 2 (逆时针 + 错相 + 不同色) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            padding: 1.5,
            WebkitMask: ringMask,
            mask: ringMask,
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              background:
                "conic-gradient(from 0deg, transparent 0deg, transparent 280deg, #06b6d4 330deg, #a855f7 355deg, transparent 360deg)",
              animation: "border-beam-thumb-spin-rev 4s linear infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}
