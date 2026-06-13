export function GlyphThumb() {
  // 纯静态展示，不依赖 use client：
  // 用「字符 + 半透明位移残影」暗示流体过渡，右侧一根 0/1/2 竖列暗示老虎机数字轮。
  return (
    <div
      className="w-full h-full flex items-center justify-center gap-3"
      style={{
        background: "linear-gradient(160deg, #0b0b0d 0%, #16161a 60%, #0d0d10 100%)",
      }}
    >
      {/* 流体文字：主字 + 上下错位的残影，模拟「模糊上浮淡入淡出」 */}
      <div style={{ position: "relative", width: 92, height: 64 }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            fontWeight: 700,
            color: "rgba(255,255,255,0.12)",
            filter: "blur(2px)",
            transform: "translateY(-12px)",
          }}
        >
          Ag
        </span>
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            fontWeight: 700,
            color: "rgba(255,255,255,0.12)",
            filter: "blur(2px)",
            transform: "translateY(12px)",
          }}
        >
          Ag
        </span>
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            fontWeight: 700,
            color: "#fafafa",
            letterSpacing: "-0.02em",
          }}
        >
          Ag
        </span>
      </div>

      {/* 老虎机竖列：露出 1，上下露半个 0 / 2，暗示滚动窗口 */}
      <div
        style={{
          height: 50,
          width: 30,
          overflow: "hidden",
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.03)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.18)" }}>0</span>
        <span style={{ fontSize: 26, fontWeight: 700, color: "#fafafa" }}>1</span>
        <span style={{ fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.18)" }}>2</span>
      </div>
    </div>
  );
}
