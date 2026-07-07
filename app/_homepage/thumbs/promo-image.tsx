export function PromoImageThumb() {
  // 纯 CSS 静态缩略图：暗色噪点渐变底 + 一张迷你「宣传图」（图卡在上、标题/说明
  // 在下），右下角一枚导出徽标，暗示「图片 + 文案 → 一键出图」。
  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background:
          "radial-gradient(60% 60% at 24% 18%, #7c3aed 0%, transparent 60%)," +
          "radial-gradient(55% 55% at 82% 30%, #4f46e5 0%, transparent 60%)," +
          "radial-gradient(65% 65% at 60% 92%, #06b6d4 0%, transparent 62%)," +
          "#0a0a14",
      }}
    >
      {/* 颗粒噪点叠层 */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.16,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.9) 0.5px, transparent 0.6px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* 迷你封面 */}
      <div
        style={{
          position: "absolute",
          inset: "16% 20%",
          display: "flex",
          flexDirection: "column",
          gap: "9%",
        }}
      >
        {/* 图片卡 */}
        <div
          style={{
            flex: "1 1 auto",
            borderRadius: 10,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06))",
            border: "1px solid rgba(255,255,255,0.16)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="22%"
            height="22%"
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.6" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>

        {/* 标题条 */}
        <div
          style={{
            height: "13%",
            width: "78%",
            borderRadius: 4,
            background: "rgba(255,255,255,0.92)",
          }}
        />
        {/* 说明条 */}
        <div
          style={{
            height: "7%",
            width: "92%",
            borderRadius: 3,
            background: "rgba(255,255,255,0.4)",
            marginTop: "-4%",
          }}
        />
      </div>

      {/* 导出徽标 */}
      <div
        style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.95)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="#0a0a14"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3v12" />
          <path d="M7 10l5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      </div>
    </div>
  );
}
