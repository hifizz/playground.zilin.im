export function ShaderFlowingLightThumb() {
  // 纯 CSS 静态缩略图：深色底 + 一条高亮流动光带（橙→粉→蓝→青，带辉光）横贯，
  // 上方一枚呼吸光点。只是「意思一下」，暗示 Demo 的核心——流动的光。
  const keyframes = `
    @keyframes sfl-thumb-flow {
      0%   { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    @keyframes sfl-thumb-breath {
      0%, 100% { transform: scale(1);   opacity: 0.85; }
      50%      { transform: scale(1.25); opacity: 1; }
    }
  `;

  const flow =
    "linear-gradient(90deg, #fb923c, #f472b6, #60a5fa, #2dd4bf, #fb923c)";

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background: "radial-gradient(120% 90% at 50% 40%, #12121c 0%, #08080c 70%)",
      }}
    >
      <style>{keyframes}</style>

      {/* 呼吸光点 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "34%",
          width: 30,
          height: 30,
          transform: "translate(-50%,-50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle, #99f6e4 0%, #2dd4bf 45%, transparent 72%)",
          boxShadow: "0 0 24px 6px rgba(45,212,191,0.7)",
          animation: "sfl-thumb-breath 2.4s ease-in-out infinite",
        }}
      />

      {/* 流动光带（含柔和光晕层） */}
      <div
        style={{
          position: "absolute",
          left: "8%",
          right: "8%",
          top: "60%",
          height: 16,
          borderRadius: 999,
          background: flow,
          backgroundSize: "200% 100%",
          filter: "blur(9px)",
          opacity: 0.75,
          animation: "sfl-thumb-flow 4s linear infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "8%",
          right: "8%",
          top: "60%",
          height: 6,
          borderRadius: 999,
          background: flow,
          backgroundSize: "200% 100%",
          boxShadow: "0 0 12px rgba(244,114,182,0.6)",
          animation: "sfl-thumb-flow 4s linear infinite",
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
