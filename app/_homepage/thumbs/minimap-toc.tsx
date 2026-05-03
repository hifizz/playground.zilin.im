export function MinimapTocThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #0a0a0a 0%, #0f0f14 100%)" }}>
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        {/* 左侧模拟消息气泡 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[52, 80, 36, 68, 44].map((w, i) => (
            <div key={i} style={{
              height: 5, width: w, borderRadius: 3,
              background: i === 1 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)",
            }} />
          ))}
        </div>
        {/* 右侧缩略线（Minimap sidebar lines） */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {[
            { width: 8, active: false },
            { width: 12, active: true },
            { width: 6, active: false },
            { width: 10, active: false },
            { width: 8, active: false },
          ].map((line, i) => (
            <div key={i} style={{
              height: 1,
              width: line.width,
              borderRadius: 1,
              background: line.active
                ? "rgba(255,255,255,0.9)"
                : "rgba(255,255,255,0.22)",
              boxShadow: line.active ? "0 0 6px rgba(255,255,255,0.7)" : "none",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
