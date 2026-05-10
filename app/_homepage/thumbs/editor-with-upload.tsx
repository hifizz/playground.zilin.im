export function EditorWithUploadThumb() {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
      }}
    >
      <div
        style={{
          width: 168,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* image strip */}
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 6,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          {[
            "linear-gradient(135deg,#60a5fa,#a78bfa)",
            "linear-gradient(135deg,#fb7185,#f59e0b)",
            "linear-gradient(135deg,#34d399,#0ea5e9)",
          ].map((bg, i) => (
            <div
              key={i}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: bg,
                flexShrink: 0,
              }}
            />
          ))}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px dashed rgba(255,255,255,0.25)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.4)",
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            +
          </div>
        </div>

        {/* editor body */}
        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ height: 4, width: "85%", borderRadius: 2, background: "rgba(255,255,255,0.32)" }} />
          <div style={{ height: 4, width: "70%", borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
          <div style={{ height: 4, width: "55%", borderRadius: 2, background: "rgba(255,255,255,0.14)" }} />
        </div>

        {/* toolbar */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "5px 8px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 8,
              color: "rgba(255,255,255,0.5)",
              padding: "2px 6px",
              borderRadius: 4,
              background: "rgba(255,255,255,0.06)",
            }}
          >
            上传
          </div>
        </div>
      </div>
    </div>
  );
}
