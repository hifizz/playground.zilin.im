export function MobileFullscreenThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #160010 0%, #220840 100%)" }}>
      <div style={{
        width: 72, height: 128, borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(8,3,14,0.8)",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        <div style={{ height: 28, background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", paddingLeft: 10 }}>
          <div style={{ height: 4, width: 32, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>
        <div style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)" }} />
          <div style={{ height: 3, width: "80%", borderRadius: 2, background: "rgba(255,255,255,0.06)" }} />
          <div style={{ height: 3, width: "60%", borderRadius: 2, background: "rgba(255,255,255,0.04)" }} />
          <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", marginTop: 4 }} />
          <div style={{ height: 3, width: "75%", borderRadius: 2, background: "rgba(255,255,255,0.05)" }} />
        </div>
        <div style={{ height: 28, background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, border: "1px solid rgba(255,255,255,0.18)" }} />
          <div style={{ width: 10, height: 10, borderRadius: 3, border: "1px solid rgba(255,255,255,0.18)" }} />
          <div style={{ width: 10, height: 10, borderRadius: 5, border: "1px solid rgba(236,72,153,0.4)", background: "rgba(236,72,153,0.1)" }} />
        </div>
      </div>
    </div>
  );
}
