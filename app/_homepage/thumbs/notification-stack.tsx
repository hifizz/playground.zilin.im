export function NotificationStackThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #080d2e 0%, #150e35 100%)" }}>
      <div style={{ position: "relative", width: 160, height: 90 }}>
        <div style={{
          position: "absolute", left: 28, right: 0, bottom: 0, height: 58,
          borderRadius: 10, background: "rgba(79,70,229,0.07)", border: "1px solid rgba(255,255,255,0.04)",
        }} />
        <div style={{
          position: "absolute", left: 14, right: 7, bottom: 9, height: 62,
          borderRadius: 10, background: "rgba(79,70,229,0.12)", border: "1px solid rgba(255,255,255,0.06)",
        }} />
        <div style={{
          position: "absolute", left: 0, right: 14, bottom: 18, height: 66,
          borderRadius: 10, background: "rgba(79,70,229,0.22)", border: "1px solid rgba(255,255,255,0.1)",
          padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: "rgba(99,102,241,0.55)", flexShrink: 0 }} />
            <div>
              <div style={{ height: 5, width: 56, borderRadius: 3, background: "rgba(255,255,255,0.28)", marginBottom: 5 }} />
              <div style={{ height: 3.5, width: 36, borderRadius: 2, background: "rgba(255,255,255,0.13)" }} />
            </div>
          </div>
          <div style={{ height: 2.5, borderRadius: 2, background: "rgba(255,255,255,0.05)" }} />
          <div style={{ height: 2.5, width: "72%", borderRadius: 2, background: "rgba(255,255,255,0.03)" }} />
        </div>
      </div>
    </div>
  );
}
