export function TimelineMinimapThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #1a0a00 0%, #251600 100%)" }}>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.1)" }} />
          {[false, true, false, false].map((active, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 7, height: 7, borderRadius: 4,
                background: active ? "rgba(251,146,60,0.9)" : "rgba(255,255,255,0.18)",
                border: active ? "1px solid rgba(251,146,60,0.45)" : "none",
                boxShadow: active ? "0 0 7px rgba(251,146,60,0.5)" : "none",
              }} />
              {i < 3 && <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.07)" }} />}
            </div>
          ))}
          <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.05)" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 12 }}>
          {[48, 64, 36, 54].map((w, i) => (
            <div key={i} style={{
              height: 5, width: w, borderRadius: 3,
              background: i === 1 ? "rgba(251,146,60,0.42)" : "rgba(255,255,255,0.1)",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
