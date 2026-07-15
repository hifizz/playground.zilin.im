// 纯静态展示，无 state：浅色卡片里几行「文字」，其中两段被荧光笔划亮
// （黄 / 绿），暗示「阅读高亮 + 模糊恢复」。

export function HighlightRecoveryThumb() {
  const rows: { w: string; marks?: { left: string; w: string; c: string }[] }[] = [
    { w: "88%" },
    { w: "94%", marks: [{ left: "34%", w: "40%", c: "rgba(253,224,71,0.85)" }] },
    { w: "78%", marks: [{ left: "6%", w: "34%", c: "rgba(134,239,172,0.9)" }] },
    { w: "70%" },
  ];
  return (
    <div
      className="flex h-full w-full items-center justify-center px-6"
      style={{ background: "linear-gradient(160deg, #fafafa 0%, #f1f5f9 100%)" }}
    >
      <div
        style={{
          width: "100%",
          borderRadius: 12,
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 14px rgba(15,23,42,0.06)",
          padding: "16px 16px 18px",
        }}
      >
        {/* 标题条 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <div style={{ width: 26, height: 6, borderRadius: 3, background: "#cbd5e1" }} />
          <div style={{ width: 60, height: 6, borderRadius: 3, background: "#94a3b8" }} />
        </div>
        {/* 文本行 + 荧光笔高亮 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ position: "relative", height: 7 }}>
              <div
                style={{ width: r.w, height: "100%", borderRadius: 3, background: "#e2e8f0" }}
              />
              {r.marks?.map((m, j) => (
                <div
                  key={j}
                  style={{
                    position: "absolute",
                    top: -1,
                    left: m.left,
                    width: m.w,
                    height: "calc(100% + 2px)",
                    borderRadius: 3,
                    background: m.c,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
