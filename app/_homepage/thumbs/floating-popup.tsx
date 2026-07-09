// 纯静态展示，无 state：一个虚线 ContainerRect，内含安全区虚线、
// 琥珀色 SelectedRect 与右侧的 FloatingPopup，暗示「围绕选区择位」。

export function FloatingPopupThumb() {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: "linear-gradient(150deg, #0c1220 0%, #111b30 60%, #0a0f1c 100%)" }}
    >
      {/* ContainerRect */}
      <div
        style={{
          position: "relative",
          width: 156,
          height: 100,
          borderRadius: 10,
          border: "1px dashed rgba(148,163,184,0.5)",
        }}
      >
        {/* 安全区 */}
        <div
          style={{
            position: "absolute",
            inset: 8,
            borderRadius: 6,
            border: "1px dashed rgba(148,163,184,0.18)",
          }}
        />
        {/* SelectedRect */}
        <div
          style={{
            position: "absolute",
            left: 20,
            top: 44,
            width: 46,
            height: 13,
            borderRadius: 3,
            background: "rgba(251,191,36,0.25)",
            border: "1px solid rgba(251,191,36,0.85)",
          }}
        />
        {/* FloatingPopup（右侧 + gap） */}
        <div
          style={{
            position: "absolute",
            left: 74,
            top: 26,
            width: 60,
            height: 48,
            borderRadius: 7,
            background: "linear-gradient(155deg, #6366f1, #4f46e5)",
            boxShadow: "0 6px 16px rgba(79,70,229,0.45)",
          }}
        >
          <div
            style={{
              margin: "9px 9px 0",
              height: 5,
              width: 30,
              borderRadius: 2,
              background: "rgba(255,255,255,0.9)",
            }}
          />
          <div
            style={{
              margin: "6px 9px 0",
              height: 4,
              width: 42,
              borderRadius: 2,
              background: "rgba(255,255,255,0.4)",
            }}
          />
          <div
            style={{
              margin: "5px 9px 0",
              height: 4,
              width: 26,
              borderRadius: 2,
              background: "rgba(255,255,255,0.4)",
            }}
          />
        </div>
        {/* 其余方向的幽灵候选 */}
        <div
          style={{
            position: "absolute",
            left: 14,
            top: 62,
            width: 60,
            height: 30,
            borderRadius: 6,
            border: "1px dashed rgba(52,211,153,0.45)",
          }}
        />
      </div>
    </div>
  );
}
