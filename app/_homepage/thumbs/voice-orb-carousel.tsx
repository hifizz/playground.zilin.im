export function VoiceOrbCarouselThumb() {
  // 纯 CSS 静态缩略图：浅色底 + 三颗音色球（中间大、两侧小），
  // 中间球叠一枚白色播放键。用 conic/radial 渐变意思一下 mesh/grain 着色器质感。
  const orbs = [
    // 左：角色（紫→桃）
    {
      size: 62,
      left: "18%",
      bg: "radial-gradient(circle at 32% 30%, #a89be0, #7c6fc4 55%, #f3b58f 105%)",
      opacity: 0.9,
    },
    // 中：旁白（粉→橙，激活）
    {
      size: 108,
      left: "50%",
      bg: "conic-gradient(from 210deg at 45% 40%, #ff8a3d, #ff6b5c, #ff8f9a, #b7c7e6, #ff8a3d)",
      opacity: 1,
    },
    // 右：对话（蓝→绿）
    {
      size: 62,
      left: "82%",
      bg: "radial-gradient(circle at 65% 35%, #9ccf72, #6fa85c 55%, #8fb4d6 105%)",
      opacity: 0.9,
    },
  ];

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 100% at 50% 30%, #ffffff 0%, #f2f2f4 70%)",
      }}
    >
      {orbs.map((o, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: o.left,
            top: "48%",
            width: o.size,
            height: o.size,
            transform: "translate(-50%,-50%)",
            borderRadius: "50%",
            background: o.bg,
            opacity: o.opacity,
            boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
          }}
        />
      ))}

      {/* 中央播放键 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "48%",
          width: 30,
          height: 30,
          transform: "translate(-50%,-50%)",
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="#171717" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>

      {/* 左右切换箭头 */}
      <div
        style={{
          position: "absolute",
          left: "6%",
          top: "48%",
          transform: "translateY(-50%)",
          color: "#c4c4c4",
          fontSize: 22,
          lineHeight: 1,
        }}
      >
        ‹
      </div>
      <div
        style={{
          position: "absolute",
          right: "6%",
          top: "48%",
          transform: "translateY(-50%)",
          color: "#c4c4c4",
          fontSize: 22,
          lineHeight: 1,
        }}
      >
        ›
      </div>

      {/* 底部音色标签 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 14,
          textAlign: "center",
          fontSize: 12,
          fontWeight: 600,
          color: "#3a3a3a",
        }}
      >
        旁白 <span style={{ fontWeight: 400 }}>↗</span>
      </div>
    </div>
  );
}
