export function LoginOnboardingThumb() {
  // 左暗右暖：左侧迷你登录表单（四角星 + 输入框 + 主按钮），右侧暖色价值轮播 + 圆点。
  // 全程回避蓝紫渐变，呼应 Demo 的配色约束。
  return (
    <div className="w-full h-full flex" style={{ background: "#0a0a0b" }}>
      {/* 左：表单 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 7,
          padding: "0 18px",
        }}
      >
        {/* 四角星 logo */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="thumb-spark" x1="0" y1="0" x2="24" y2="24">
              <stop offset="0%" stopColor="#FBBF6B" />
              <stop offset="100%" stopColor="#EF7E54" />
            </linearGradient>
          </defs>
          <path
            d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0Z"
            fill="url(#thumb-spark)"
          />
        </svg>
        <div style={{ height: 6, width: "85%", borderRadius: 3, background: "rgba(255,255,255,0.85)" }} />
        <div style={{ height: 4, width: "60%", borderRadius: 2, background: "rgba(255,255,255,0.22)" }} />
        {/* 输入框 */}
        <div
          style={{
            marginTop: 4,
            height: 16,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(255,255,255,0.03)",
          }}
        />
        {/* 主按钮 */}
        <div style={{ height: 16, borderRadius: 999, background: "#f0f0f0" }} />
      </div>

      {/* 右：暖色轮播 */}
      <div
        style={{
          position: "relative",
          flex: 1,
          overflow: "hidden",
          background: "linear-gradient(150deg,#1a1207 0%,#7c2d12 42%,#b91c1c 72%,#f59e0b 100%)",
        }}
      >
        {/* 光斑 */}
        <div
          style={{
            position: "absolute",
            left: -20,
            top: -14,
            width: 90,
            height: 90,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,158,11,0.85), transparent 70%)",
            filter: "blur(14px)",
          }}
        />
        {/* 旋转切面 */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "70%",
            height: "120%",
            transform: "translate(-50%,-50%) rotate(42deg)",
            borderRadius: 26,
            background: "linear-gradient(135deg, rgba(251,191,36,0.55), rgba(190,24,60,0.35))",
          }}
        />
        {/* 文案占位 */}
        <div style={{ position: "absolute", left: 16, top: 24, right: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ height: 6, width: "80%", borderRadius: 3, background: "rgba(255,255,255,0.9)" }} />
          <div style={{ height: 6, width: "55%", borderRadius: 3, background: "rgba(255,255,255,0.9)" }} />
        </div>
        {/* 圆点 */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.45)" }} />
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.45)" }} />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
