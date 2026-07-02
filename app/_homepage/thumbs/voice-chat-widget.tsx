export function VoiceChatWidgetThumb() {
  // 纯 CSS 静态缩略图：浅色底 + 右下角一张迷你对话框卡片（蓝绿 sphere 语音球 +
  // 白色通话键 + 输入线），左下角一枚「语音聊天」胶囊，暗示「点胶囊展开对话框」。
  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 100% at 30% 20%, #ffffff 0%, #eef0f3 75%)",
      }}
    >
      {/* 折叠胶囊 */}
      <div
        style={{
          position: "absolute",
          left: 14,
          bottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "6px 12px 6px 7px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 6px 16px -6px rgba(0,0,0,0.25)",
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 30%, #a8d9ff, #4a90d9 55%, #6fae7a 110%)",
            boxShadow: "inset -1px -2px 3px rgba(0,0,0,0.18)",
          }}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#3a3a3a" }}>
          语音聊天
        </span>
      </div>

      {/* 迷你对话框卡片（右下角） */}
      <div
        style={{
          position: "absolute",
          right: 14,
          bottom: 14,
          width: 118,
          borderRadius: 16,
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 14px 30px -12px rgba(0,0,0,0.4)",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* sphere 语音球 + 通话键 */}
        <div style={{ position: "relative", width: 56, height: 56 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 38% 32%, #a8d9ff 0%, #4a90d9 52%, #2f6fb0 90%), radial-gradient(circle at 70% 75%, #9ad3a4, transparent 55%)",
              boxShadow: "inset -3px -4px 10px rgba(0,0,0,0.22)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%)",
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 24 24" width="11" height="11" fill="#171717" aria-hidden>
              <path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11 11 0 0 0 3.5.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .56 3.5 1 1 0 0 1-.24 1z" />
            </svg>
          </div>
        </div>

        {/* 输入线 */}
        <div
          style={{
            marginTop: 12,
            width: "100%",
            height: 16,
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,0.1)",
          }}
        />
      </div>
    </div>
  );
}
