export function ShadersThumb() {
  // 纯 CSS 静态缩略图（不挂 WebGL）：深色底 + 冷色弥散球团（暗示 MeshGradient /
  // Metaballs）+ 一圈脉动辉光边框（暗示 PulsingBorder）。
  const keyframes = `
    @keyframes shaders-thumb-drift {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50%      { transform: translate(6px, -5px) scale(1.12); }
    }
    @keyframes shaders-thumb-breath {
      0%, 100% { opacity: 0.55; }
      50%      { opacity: 1; }
    }
  `;

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 30% 25%, #0b2b3a 0%, #071018 55%, #05060a 100%)",
      }}
    >
      <style>{keyframes}</style>

      {/* 弥散球团：teal / cyan / blue / emerald 冷色，blur 融合 */}
      <div
        style={{
          position: "absolute",
          left: "18%",
          top: "30%",
          width: "46%",
          height: "46%",
          borderRadius: "50%",
          background: "radial-gradient(circle, #22d3ee, transparent 70%)",
          filter: "blur(14px)",
          animation: "shaders-thumb-drift 5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "48%",
          top: "44%",
          width: "40%",
          height: "40%",
          borderRadius: "50%",
          background: "radial-gradient(circle, #2563eb, transparent 70%)",
          filter: "blur(16px)",
          animation: "shaders-thumb-drift 6.5s ease-in-out infinite reverse",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "36%",
          top: "18%",
          width: "30%",
          height: "30%",
          borderRadius: "50%",
          background: "radial-gradient(circle, #10b981, transparent 70%)",
          filter: "blur(12px)",
          animation: "shaders-thumb-drift 5.8s ease-in-out infinite",
        }}
      />

      {/* 脉动辉光边框（PulsingBorder 暗示） */}
      <div
        style={{
          position: "absolute",
          inset: "8%",
          borderRadius: 12,
          border: "1.5px solid rgba(103,232,249,0.55)",
          boxShadow:
            "0 0 12px rgba(34,211,238,0.55), inset 0 0 14px rgba(34,211,238,0.3)",
          animation: "shaders-thumb-breath 2.4s ease-in-out infinite",
        }}
      />

      {/* 角标文字 */}
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 10,
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 10,
          letterSpacing: "0.25em",
          color: "rgba(165,243,252,0.8)",
        }}
      >
        SHADERS
      </div>
    </div>
  );
}
