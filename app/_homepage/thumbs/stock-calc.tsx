export function StockCalcThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #0c1117 0%, #111520 100%)" }}>
      <div style={{ width: 148, display: "flex", flexDirection: "column", gap: 7 }}>
        {[{ prefix: "$", w: 60 }, { prefix: "×", w: 44 }, { prefix: "$", w: 56 }].map(({ prefix, w }, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "monospace" }}>{prefix}</span>
            </div>
            <div style={{
              flex: 1, height: 28, borderRadius: 6,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", paddingLeft: 8,
            }}>
              <div style={{ height: 4, width: w, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
            </div>
          </div>
        ))}
        <div style={{
          borderRadius: 10,
          background: "rgba(52,211,153,0.1)",
          border: "1px solid rgba(52,211,153,0.18)",
          padding: "8px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ height: 5, width: 36, borderRadius: 3, background: "rgba(52,211,153,0.52)" }} />
          <div style={{ height: 4, width: 52, borderRadius: 2, background: "rgba(52,211,153,0.38)" }} />
        </div>
      </div>
    </div>
  );
}
