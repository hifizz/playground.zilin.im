export function RainbowBorderThumb() {
  const keyframes = `
    @keyframes rb-thumb-spin {
      to { rotate: 1turn; }
    }
  `;

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: "#ffffff" }}
    >
      <style>{keyframes}</style>

      {/* Scaled-down card with rainbow border */}
      <div
        style={{
          width: "75%",
          height: "52%",
          position: "relative",
          isolation: "isolate",
          display: "inline-flex",
        }}
      >
        {/* Spinning conic-gradient layer */}
        <div
          style={{
            position: "absolute",
            inset: 1,
            borderRadius: 5,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              translate: "-50% -50%",
              width: "150%",
              aspectRatio: "1",
              background:
                "conic-gradient(in oklch longer hue, oklch(0.85 0.37 145.75), oklch(0.85 0.37 145.75))",
              animation: "rb-thumb-spin 3s linear infinite",
            }}
          />
        </div>

        {/* White blur clip */}
        <div
          style={{
            position: "absolute",
            background: "white",
            filter: "blur(5px)",
            borderRadius: 7,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />

        {/* Content area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            margin: 5,
            borderRadius: 5,
            backdropFilter: "blur(16px)",
            background: "transparent",
            justifyContent: "center",
            alignItems: "center",
            gap: 5,
          }}
        >
          <div
            style={{
              width: "62%",
              height: 3,
              borderRadius: 2,
              background: "rgba(42,16,58,0.35)",
            }}
          />
          <div
            style={{
              width: "44%",
              height: 2,
              borderRadius: 2,
              background: "rgba(42,16,58,0.15)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
