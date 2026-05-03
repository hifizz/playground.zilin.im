export function ListAnimationThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #011c18 0%, #02201e 100%)" }}>
      <div style={{ width: 148, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{
          borderRadius: 10,
          background: "rgba(52,211,153,0.14)",
          border: "1px solid rgba(52,211,153,0.22)",
          padding: "10px 12px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: "rgba(52,211,153,0.38)", flexShrink: 0 }} />
          <div>
            <div style={{ height: 4, width: 64, borderRadius: 2, background: "rgba(255,255,255,0.3)", marginBottom: 4 }} />
            <div style={{ height: 3, width: 40, borderRadius: 2, background: "rgba(255,255,255,0.14)" }} />
          </div>
        </div>
        {[{ w: 52, opacity: 0.07 }, { w: 40, opacity: 0.05 }].map(({ w, opacity }, i) => (
          <div key={i} style={{
            borderRadius: 10,
            background: `rgba(255,255,255,${opacity})`,
            border: "1px solid rgba(255,255,255,0.04)",
            padding: "10px 12px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
            <div>
              <div style={{ height: 4, width: w, borderRadius: 2, background: "rgba(255,255,255,0.18)", marginBottom: 4 }} />
              <div style={{ height: 3, width: w - 14, borderRadius: 2, background: "rgba(255,255,255,0.08)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
