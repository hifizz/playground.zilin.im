export function VoiceAgentTranscriptThumb() {
  // 纯 CSS 静态缩略图：浅灰底 + 一张对话卡片，顶部 sphere 头像 + 名字，
  // 下面三条聊天气泡（智能体靠左浅灰、用户靠右加深），暗示「消息逐条渐显登场」。
  const bubble = (
    align: "left" | "right",
    w: string,
    lines: number,
  ) => (
    <div
      style={{
        alignSelf: align === "left" ? "flex-start" : "flex-end",
        width: w,
        borderRadius: 9,
        borderBottomLeftRadius: align === "left" ? 3 : 9,
        borderBottomRightRadius: align === "right" ? 3 : 9,
        background: align === "left" ? "#eef0f2" : "#ffffff",
        border: align === "left" ? "none" : "1px solid rgba(0,0,0,0.06)",
        boxShadow:
          align === "right" ? "0 4px 10px -5px rgba(0,0,0,0.25)" : "none",
        padding: "7px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 4,
            borderRadius: 2,
            width: i === lines - 1 ? "62%" : "100%",
            background:
              align === "left" ? "rgba(0,0,0,0.16)" : "rgba(0,0,0,0.4)",
          }}
        />
      ))}
    </div>
  );

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, #ffffff 0%, #e9eaec 80%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 200,
          borderRadius: 16,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 16px 34px -16px rgba(0,0,0,0.4)",
          padding: 14,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 头部 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingBottom: 12,
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 36% 30%, #a8d9ff 0%, #4a90d9 52%, #2f6fb0 92%), radial-gradient(circle at 72% 78%, #9ad3a4, transparent 55%)",
              boxShadow: "inset -1px -2px 4px rgba(0,0,0,0.22)",
            }}
          />
          <div
            style={{
              height: 6,
              width: 62,
              borderRadius: 3,
              background: "rgba(0,0,0,0.55)",
            }}
          />
        </div>

        {/* 气泡组 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {bubble("left", "82%", 2)}
          {bubble("right", "88%", 2)}
          {bubble("left", "70%", 1)}
        </div>
      </div>
    </div>
  );
}
