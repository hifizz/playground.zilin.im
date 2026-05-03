export function ShareDialogThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #160826 0%, #220a44 100%)" }}>
      <div style={{
        width: 148,
        borderRadius: 14,
        background: "rgba(14,8,24,0.88)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "14px 14px 12px",
        display: "flex", flexDirection: "column", gap: 9,
      }}>
        <div style={{ height: 5, width: 52, borderRadius: 3, background: "rgba(255,255,255,0.2)" }} />
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          borderRadius: 8, background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.07)", padding: "6px 8px",
        }}>
          <div style={{ width: 11, height: 11, borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
          <div style={{ flex: 1, height: 3.5, borderRadius: 2, background: "rgba(255,255,255,0.14)" }} />
        </div>
        <div style={{
          borderRadius: 8, background: "rgba(139,92,246,0.55)",
          padding: "7px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ height: 5, width: 32, borderRadius: 3, background: "rgba(255,255,255,0.65)" }} />
        </div>
      </div>
    </div>
  );
}
