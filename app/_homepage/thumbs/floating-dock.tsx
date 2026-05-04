export function FloatingDockThumb() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-end pb-6"
      style={{ background: "linear-gradient(160deg, #0d0d14 0%, #12121c 100%)" }}
    >
      {/* Simulated content rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18, width: 110, alignSelf: "center" }}>
        {[80, 60, 72, 50].map((w, i) => (
          <div key={i} style={{ height: 5, width: w, borderRadius: 3, background: "rgba(255,255,255,0.09)" }} />
        ))}
      </div>
      {/* Dock bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "6px 8px",
        backdropFilter: "blur(12px)",
      }}>
        {[true, false, false, false].map((active, i) => (
          <div key={i} style={{
            width: 28, height: 28,
            borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: active ? "rgba(99,102,241,0.85)" : "transparent",
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: 3,
              background: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}
