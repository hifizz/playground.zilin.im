/* eslint-disable @next/next/no-img-element */
export function HarkProSigninThumb() {
  // 草甸壁纸上悬浮一个迷你 Hark Pro 登录窗：左人像、右字标 + 两颗白色胶囊按钮。
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundImage: "url(/hark-pro-signin/meadow-thumb.webp)",
        backgroundSize: "cover",
        backgroundPosition: "center 60%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 210,
          height: 141,
          transform: "translate(-50%, -54%)",
          borderRadius: 6,
          overflow: "hidden",
          background:
            "radial-gradient(120% 70% at 50% 108%, rgba(118,124,158,0.55), rgba(40,50,90,0) 70%), linear-gradient(180deg,#121833,#1f2850 50%,#333e63)",
          boxShadow: "0 10px 24px rgba(10,20,50,0.35)",
        }}
      >
        <div style={{ position: "absolute", left: 5, top: 5, display: "flex", gap: 3 }}>
          {["#ee5f57", "#f6bd2f", "#4cae42"].map((c) => (
            <span key={c} style={{ width: 4, height: 4, borderRadius: 2, background: c }} />
          ))}
        </div>
        <img
          src="/hark-pro-signin/portrait.webp"
          alt=""
          style={{
            position: "absolute",
            left: 4,
            top: 13,
            width: 98,
            height: 124,
            objectFit: "cover",
            objectPosition: "50% 30%",
            borderRadius: 4,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 102,
            right: 0,
            top: 34,
            textAlign: "center",
            fontFamily: "ui-serif, Georgia, serif",
            fontSize: 10,
            color: "#f4f5fa",
          }}
        >
          hark <span style={{ fontStyle: "italic", color: "rgba(196,201,224,0.5)" }}>pro</span>
        </div>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 124,
              width: 64,
              top: 62 + i * 11,
              height: 8,
              borderRadius: 4,
              background: "#f3f3f5",
            }}
          />
        ))}
        <div style={{ position: "absolute", left: 124, width: 64, top: 90, height: 8, borderRadius: 4, background: "rgba(9,13,34,0.32)" }} />
        <div style={{ position: "absolute", left: 124, width: 64, top: 101, height: 8, borderRadius: 4, background: "#7c8299" }} />
      </div>
    </div>
  );
}
