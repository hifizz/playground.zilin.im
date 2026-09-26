export function SpringDialogThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #ece7ff 0%, #fbe7f4 100%)" }}>
      <div style={{ position: "relative", width: 160, height: 112 }}>
        <div style={{
          position: "absolute", top: 0, right: 8, width: 106, height: 74,
          borderRadius: 12, background: "rgba(255,255,255,0.35)",
          border: "1px solid rgba(139,92,246,0.18)", transform: "rotate(6deg)",
        }} />
        <div style={{
          position: "absolute", top: 14, right: 26, width: 112, height: 78,
          borderRadius: 12, background: "rgba(255,255,255,0.6)",
          border: "1px solid rgba(139,92,246,0.2)", transform: "rotate(3deg)",
        }} />
        <div style={{
          position: "absolute", left: 0, bottom: 0, width: 118, height: 86,
          borderRadius: 14, background: "#ffffff",
          border: "1px solid rgba(99,60,220,0.15)",
          boxShadow: "0 12px 32px rgba(97,66,214,0.28)",
          transform: "rotate(-3deg)", padding: "10px 11px",
          display: "flex", flexDirection: "column", gap: 7,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{
              width: 14, height: 14, borderRadius: 5, flexShrink: 0,
              background: "linear-gradient(135deg, #8b5cf6, #d946ef)",
            }} />
            <div style={{ height: 5, width: 46, borderRadius: 3, background: "rgba(15,15,30,0.22)" }} />
          </div>
          <div style={{ height: 3.5, borderRadius: 2, background: "rgba(15,15,30,0.09)" }} />
          <div style={{ height: 3.5, width: "72%", borderRadius: 2, background: "rgba(15,15,30,0.07)" }} />
          <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
            <div style={{ flex: 1, height: 12, borderRadius: 6, background: "rgba(15,15,30,0.07)" }} />
            <div style={{
              flex: 1, height: 12, borderRadius: 6,
              background: "linear-gradient(90deg, #8b5cf6, #d946ef)",
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
