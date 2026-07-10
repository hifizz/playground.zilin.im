export function AnimateHeightAutoThumb() {
  const keyframes = `
    @keyframes haa-thumb-snap {
      0%, 34%  { height: 0px; }
      35%, 84% { height: 34px; }
      85%, 100% { height: 0px; }
    }
    @keyframes haa-thumb-fluid {
      0%, 22%  { height: 0px; }
      35%, 72% { height: 34px; }
      85%, 100% { height: 0px; }
    }
  `;

  const bar = (width: string, alpha: number, height = 3) => (
    <div
      style={{
        width,
        height,
        borderRadius: 2,
        background: `rgba(15,18,25,${alpha})`,
      }}
    />
  );

  const miniCard = (animation: string) => (
    <div
      style={{
        width: 96,
        borderRadius: 9,
        background: "#fff",
        boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
        overflow: "hidden",
      }}
    >
      {/* header */}
      <div style={{ padding: "7px 8px 6px", display: "flex", flexDirection: "column", gap: 3.5 }}>
        {bar("62%", 0.55)}
        {bar("42%", 0.22, 2.5)}
      </div>
      {/* expanding content */}
      <div style={{ overflow: "hidden", animation }}>
        <div
          style={{
            margin: "0 6px",
            padding: 6,
            borderRadius: 6,
            background: "#fafafa",
            border: "1px solid #ececee",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {bar("88%", 0.18, 2.5)}
          {bar("78%", 0.15, 2.5)}
          {bar("84%", 0.11, 2.5)}
          {bar("55%", 0.07, 2.5)}
        </div>
      </div>
      {/* footer */}
      <div style={{ padding: "6px 8px 7px", display: "flex", justifyContent: "space-between" }}>
        {bar("28%", 0.18, 2.5)}
        {bar("22%", 0.18, 2.5)}
      </div>
    </div>
  );

  const pill = (text: string, color: string, bg: string, border: string) => (
    <div
      style={{
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 7.5,
        lineHeight: 1,
        color,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 5,
        padding: "3px 6px",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );

  return (
    <div
      className="w-full h-full flex items-center justify-center gap-5"
      style={{
        background: "linear-gradient(150deg, #101014 0%, #191921 100%)",
      }}
    >
      <style>{keyframes}</style>

      {/* 左:height auto,内容区高度跳变 */}
      <div style={{ height: 122, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
        {miniCard("haa-thumb-snap 4.2s ease infinite")}
        {pill("height: auto", "#ff8589", "rgba(229,72,77,0.14)", "rgba(229,72,77,0.4)")}
      </div>

      {/* 右:0fr → 1fr,内容区平滑生长 */}
      <div style={{ height: 122, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
        {miniCard("haa-thumb-fluid 4.2s cubic-bezier(0.32,0.72,0,1) infinite")}
        {pill("0fr → 1fr", "#5fd39a", "rgba(48,164,108,0.16)", "rgba(48,164,108,0.45)")}
      </div>
    </div>
  );
}
