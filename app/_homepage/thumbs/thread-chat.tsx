export function ThreadChatThumb() {
  const keyframes = `
    @keyframes tc-thumb-drawer {
      0%, 18%  { transform: translateX(108%); }
      32%, 78% { transform: translateX(0); }
      92%, 100% { transform: translateX(108%); }
    }
  `;

  const line = (width: string, alpha: number, height = 2.5) => (
    <div
      style={{
        width,
        height,
        borderRadius: 2,
        background: `rgba(36,33,27,${alpha})`,
      }}
    />
  );

  const col = (edge: string | null, children: React.ReactNode) => (
    <div
      style={{
        position: "relative",
        width: 62,
        height: 112,
        borderRadius: 7,
        background: "#fbf9f3",
        border: "1px solid #d3cbb8",
        overflow: "hidden",
        padding: "8px 7px",
        display: "flex",
        flexDirection: "column",
        gap: 4.5,
        flex: "none",
      }}
    >
      {edge && (
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: edge }} />
      )}
      {children}
    </div>
  );

  const crumb = (color: string) => (
    <div
      style={{
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 5.5,
        lineHeight: 1,
        color,
        background: "#fff",
        border: `1px solid ${color}55`,
        borderRadius: 3,
        padding: "2px 3px",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      主线›图记忆›时序
    </div>
  );

  const fnote = (color: string) => (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 6,
        borderRadius: 2,
        background: color,
        flex: "none",
      }}
    />
  );

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: "linear-gradient(150deg, #f5f2ea 0%, #e9e2d2 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{keyframes}</style>

      <div style={{ display: "flex", gap: 7, transform: "translateX(-14px)" }}>
        {/* 主线列 */}
        {col(null, (
          <>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 8, color: "#24211b" }}>主线</div>
            {line("88%", 0.16)}
            {line("74%", 0.16)}
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {line("46%", 0.16)}
              {fnote("#2f7d6b")}
            </div>
            {line("82%", 0.16)}
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {line("58%", 0.16)}
              {fnote("#b07d2e")}
            </div>
            {line("70%", 0.16)}
          </>
        ))}

        {/* L1 分支列 */}
        {col("#2f7d6b", (
          <>
            <div
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 6,
                color: "#2f7d6b",
                fontWeight: 700,
              }}
            >
              L1 向量检索
            </div>
            {line("84%", 0.14)}
            {line("90%", 0.14)}
            {line("66%", 0.14)}
            {line("78%", 0.14)}
          </>
        ))}

        {/* L2 分支列（面包屑替换） */}
        {col("#a94f5e", (
          <>
            {crumb("#a94f5e")}
            {line("80%", 0.14)}
            {line("88%", 0.14)}
            {line("60%", 0.14)}
          </>
        ))}
      </div>

      {/* Artifact 抽屉：从右侧滑入滑出 */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 10,
          bottom: 10,
          width: 74,
          background: "#f5f2ea",
          borderLeft: "1px solid #d3cbb8",
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
          boxShadow: "-10px 0 22px -10px rgba(30,26,20,0.45)",
          padding: "7px 7px",
          display: "flex",
          flexDirection: "column",
          gap: 5,
          animation: "tc-thumb-drawer 5.2s cubic-bezier(0.32,0.72,0,1) infinite",
        }}
      >
        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2f7d6b" }} />
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#b07d2e" }} />
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a94f5e" }} />
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 5.5,
              color: "#a79e8d",
            }}
          >
            ARTIFACT
          </span>
        </div>
        <div
          style={{
            flex: 1,
            borderRadius: 5,
            background: "#2b2820",
            padding: "6px 6px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {["72%", "88%", "58%", "80%", "44%", "66%"].map((w, i) => (
            <div key={i} style={{ width: w, height: 2.5, borderRadius: 2, background: "rgba(240,234,216,0.5)" }} />
          ))}
        </div>
      </div>

      {/* ⌘K 会话树提示 */}
      <div
        style={{
          position: "absolute",
          left: 10,
          bottom: 9,
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 7.5,
          lineHeight: 1,
          color: "#6a6357",
          background: "#ffffffcc",
          border: "1px solid #d3cbb8",
          borderRadius: 5,
          padding: "3px 6px",
        }}
      >
        ⌘K 会话树 · 划选开分支
      </div>
    </div>
  );
}
