export function MobileFullscreenSvhThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #04121a 0%, #062b33 100%)" }}>
      <div style={{
        width: 72, height: 128, borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(3,10,14,0.85)",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        <div style={{ height: 26, background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 8, letterSpacing: 1, color: "rgba(94,234,212,0.8)", fontFamily: "monospace" }}>svh</div>
        </div>
        <div style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ flex: 1, height: 12, borderRadius: 3, background: "rgba(45,212,191,0.18)", border: "1px solid rgba(45,212,191,0.35)" }} />
            <div style={{ flex: 1, height: 12, borderRadius: 3, background: "rgba(255,255,255,0.05)" }} />
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ flex: 1, height: 12, borderRadius: 3, background: "rgba(255,255,255,0.05)" }} />
            <div style={{ flex: 1, height: 12, borderRadius: 3, background: "rgba(255,255,255,0.05)" }} />
          </div>
          <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", marginTop: 3 }} />
          <div style={{ height: 3, width: "75%", borderRadius: 2, background: "rgba(255,255,255,0.05)" }} />
        </div>
        <div style={{ height: 26, background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, border: "1px solid rgba(45,212,191,0.5)", background: "rgba(45,212,191,0.12)" }} />
          <div style={{ width: 10, height: 10, borderRadius: 3, border: "1px solid rgba(255,255,255,0.18)" }} />
          <div style={{ width: 10, height: 10, borderRadius: 5, border: "1px solid rgba(255,255,255,0.18)" }} />
        </div>
      </div>
    </div>
  );
}
