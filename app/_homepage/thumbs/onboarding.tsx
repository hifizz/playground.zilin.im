export function OnboardingThumb() {
  // 暗色页面底 + 左下角悬浮一张迷你引导卡：顶部渐变 banner（青紫发光球）+ 标题 + 两个按钮，
  // 还原 HeroUI Pro 那张卡片从角落弹出的感觉。
  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 70% 0%,#15151c,#08080b)" }}
    >
      {/* 角落弹出方向暗示：左下指向的小箭头光 */}
      <div
        style={{
          position: "absolute",
          left: 10,
          bottom: 10,
          width: 132,
          borderRadius: 12,
          overflow: "hidden",
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.55)",
        }}
      >
        {/* mini banner */}
        <div
          style={{
            position: "relative",
            height: 56,
            background: "linear-gradient(160deg,#E9E9FF 0%,#CCE5F1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* 青紫发光球 */}
          <div
            style={{
              position: "absolute",
              right: -14,
              top: -10,
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#5DD0E7,#7300FF)",
              filter: "blur(16px)",
              opacity: 0.85,
            }}
          />
          {/* 关闭 X */}
          <div
            style={{
              position: "absolute",
              right: 7,
              top: 6,
              width: 9,
              height: 9,
              color: "rgba(0,0,0,0.4)",
              fontSize: 10,
              lineHeight: "9px",
            }}
          >
            ✕
          </div>
          {/* Pro logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, zIndex: 1 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 3,
                background: "linear-gradient(135deg,#7AA3FF,#2F6BE0)",
              }}
            />
            <span
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#3D7BF0",
                letterSpacing: -0.5,
              }}
            >
              Pro
            </span>
          </div>
        </div>

        {/* body */}
        <div style={{ padding: "8px 9px 9px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ height: 4, width: "80%", borderRadius: 2, background: "rgba(255,255,255,0.7)" }} />
          <div style={{ height: 3, width: "100%", borderRadius: 2, background: "rgba(255,255,255,0.16)" }} />
          <div style={{ height: 3, width: "62%", borderRadius: 2, background: "rgba(255,255,255,0.16)" }} />
          <div style={{ display: "flex", gap: 5, marginTop: 3 }}>
            <div
              style={{
                flex: 1,
                height: 16,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            />
            <div style={{ flex: 1, height: 16, borderRadius: 8, background: "#fff" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
