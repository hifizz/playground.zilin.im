export function LwcLiveThumb() {
  // 流式数据：抖动的 area 线 + 末端 pulse 圆点 + LIVE 徽标。
  const path =
    "M0,60 L10,58 L20,54 L30,56 L40,52 L50,50 L60,46 L70,48 L80,42 L90,44 L100,38 L110,40 L120,34 L130,32 L140,28 L150,30 L160,24 L170,22 L180,18 L190,16 L200,14";
  const area = path + " L200,80 L0,80 Z";
  return (
    <div
      className="w-full h-full"
      style={{
        background:
          "linear-gradient(160deg, #050a08 0%, #08120e 60%, #06090a 100%)",
        padding: "12px 14px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes lwc-live-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.6); }
        }
        @keyframes lwc-live-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "monospace",
          fontSize: 10,
          color: "#5eead4",
          letterSpacing: "0.18em",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "#34d399",
            animation: "lwc-live-blink 1.4s ease-in-out infinite",
          }}
        />
        LIVE · 1S
      </div>

      <div
        style={{
          fontFamily: "monospace",
          fontSize: 18,
          color: "rgba(255,255,255,0.92)",
          fontWeight: 600,
        }}
      >
        $258.32
      </div>

      <svg
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "60%",
        }}
      >
        <defs>
          <linearGradient id="lwc-live-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lwc-live-fill)" />
        <path d={path} stroke="#34d399" strokeWidth={1.6} fill="none" />
      </svg>

      {/* 末端 pulse 圆点 */}
      <div
        style={{
          position: "absolute",
          right: 8,
          bottom: 14,
          width: 8,
          height: 8,
          borderRadius: 999,
          background: "#34d399",
          boxShadow: "0 0 10px #34d399",
          animation: "lwc-live-pulse 1.6s ease-in-out infinite",
        }}
      />
    </div>
  );
}
