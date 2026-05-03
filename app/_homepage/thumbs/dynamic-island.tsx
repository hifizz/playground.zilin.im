export function DynamicIslandThumb() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(145deg, #111 0%, #000 100%)" }}>
      <div
        style={{
          position: "relative",
          width: 88,
          height: 148,
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(8,8,8,0.96)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 14,
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            width: 62,
            height: 22,
            borderRadius: 11,
            background: "#000",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          {[3, 5, 4, 7, 4, 5, 3].map((h, i) => (
            <div
              key={i}
              style={{ width: 2, height: h * 2.1, borderRadius: 1, background: "rgba(255,255,255,0.72)" }}
            />
          ))}
        </div>
        <div style={{ width: 60, display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
          <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.04)" }} />
          <div style={{ height: 2, width: "70%", borderRadius: 1, background: "rgba(255,255,255,0.025)" }} />
        </div>
      </div>
    </div>
  );
}
