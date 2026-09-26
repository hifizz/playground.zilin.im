export function ModelReasoningThumb() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 80%, #293b30, #111417 80%)" }}>
      <div style={{ width: 184, padding: 16, border: "1px solid #ffffff18", borderRadius: 16, background: "#1b1f23", boxShadow: "0 16px 35px #0005" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#e4e7e4", fontSize: 11 }}><span>Reasoning</span><span style={{ width: 25, height: 14, padding: 3, borderRadius: 20, background: "#b6d7b5" }}><span style={{ display: "block", marginLeft: 11, width: 8, height: 8, borderRadius: 20, background: "#1b1f23" }} /></span></div>
        <div style={{ display: "flex", marginTop: 16, padding: 3, borderRadius: 7, background: "#111417" }}>
          {["Low", "Med", "High", "Max"].map((label, i) => <span key={label} style={{ flex: 1, padding: "5px 0", borderRadius: 5, textAlign: "center", fontSize: 9, background: i === 2 ? "#b6d7b5" : "transparent", color: i === 2 ? "#172418" : "#858b90" }}>{label}</span>)}
        </div>
        <div style={{ display: "flex", alignItems: "end", height: 46, gap: 3, marginTop: 12 }}>
          {Array.from({ length: 24 }, (_, i) => <span key={i} style={{ flex: 1, height: 8 + i * 1.6, borderRadius: "2px 2px 0 0", background: i < 18 ? "#b6d7b5" : "#ffffff12", opacity: i < 18 ? 0.35 + i / 36 : 1 }} />)}
        </div>
      </div>
    </div>
  );
}
