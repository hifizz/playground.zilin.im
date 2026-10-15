export function FloatingMenuThumb() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-start pt-6"
      style={{ background: "linear-gradient(160deg, #0d0d14 0%, #12121c 100%)" }}
    >
      {/* Simulated page content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 7,
          marginTop: 52,
          width: 110,
          alignSelf: "center",
        }}
      >
        {[80, 60, 72, 50].map((w, i) => (
          <div
            key={i}
            style={{ height: 5, width: w, borderRadius: 3, background: "rgba(255,255,255,0.07)" }}
          />
        ))}
      </div>

      {/* Floating menu capsule */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: 170,
          height: 34,
          padding: "0 8px 0 14px",
          background: "#171717",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 999,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: "rgba(255,255,255,0.92)",
          }}
        >
          MENU
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 999,
          }}
        >
          {/* hamburger */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ width: 10, height: 1.5, borderRadius: 1, background: "rgba(255,255,255,0.85)" }} />
            <div style={{ width: 10, height: 1.5, borderRadius: 1, background: "rgba(255,255,255,0.85)" }} />
          </div>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>Menu</span>
        </div>
      </div>
    </div>
  );
}
