export function ShaderFlowingLightThumb() {
  // 纯 CSS 静态缩略图：深色底 + 底部一条起伏流光带（暗示①语音流光）+ 中央呼吸
  // 光环（暗示②）+ 一圈边缘辉光（暗示③边缘流光）。
  const keyframes = `
    @keyframes sfl-thumb-breath {
      0%, 100% { transform: scale(1); opacity: 0.7; }
      50%      { transform: scale(1.1); opacity: 1; }
    }
    @keyframes sfl-thumb-edge {
      0%, 100% { opacity: 0.5; }
      50%      { opacity: 0.95; }
    }
  `;

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ background: "#08080c" }}
    >
      <style>{keyframes}</style>

      {/* ③ 边缘流光 */}
      <div
        style={{
          position: "absolute",
          inset: "7%",
          borderRadius: 14,
          border: "1.5px solid transparent",
          boxShadow:
            "0 0 14px rgba(45,212,191,0.55), inset 0 0 16px rgba(96,165,250,0.35)",
          background:
            "linear-gradient(#08080c,#08080c) padding-box, linear-gradient(120deg,#fb923c,#f472b6,#60a5fa,#2dd4bf) border-box",
          animation: "sfl-thumb-edge 3s ease-in-out infinite",
        }}
      />

      {/* ② 呼吸光环 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "44%",
          width: "38%",
          height: "38%",
          transform: "translate(-50%,-50%)",
          borderRadius: "50%",
          border: "3px solid rgba(45,212,191,0.9)",
          boxShadow:
            "0 0 18px rgba(45,212,191,0.7), inset 0 0 10px rgba(96,165,250,0.5)",
          animation: "sfl-thumb-breath 2.6s ease-in-out infinite",
        }}
      />

      {/* ① 底部语音流光带 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "34%",
          background:
            "linear-gradient(to top, rgba(251,146,60,0.9), rgba(244,114,182,0.5) 45%, rgba(96,165,250,0.15) 80%, transparent)",
          clipPath:
            "polygon(0 55%, 12% 35%, 26% 60%, 40% 30%, 55% 55%, 70% 28%, 85% 52%, 100% 38%, 100% 100%, 0 100%)",
          filter: "blur(0.5px)",
        }}
      />

      {/* 角标文字 */}
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 10,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 10,
          letterSpacing: "0.25em",
          color: "rgba(153,246,228,0.85)",
        }}
      >
        FLOWING LIGHT
      </div>
    </div>
  );
}
