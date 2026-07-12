// 纯静态展示，无 state：几行「文本」中一段被高亮，下方三枚 position/exact/fuzzy
// 策略徽章，暗示「文本锚点分层恢复」的核心。

export function HighlightRecoveryThumb() {
  const lines = [
    { w: "86%", mark: null },
    { w: "94%", mark: { left: "8%", w: "52%" } },
    { w: "72%", mark: null },
  ];
  return (
    <div
      className="flex h-full w-full flex-col justify-center gap-3 px-6"
      style={{ background: "linear-gradient(150deg, #0c1220 0%, #1a1410 55%, #0a0f1c 100%)" }}
    >
      {/* 文本行 + 一段高亮 */}
      <div className="flex flex-col gap-2">
        {lines.map((ln, i) => (
          <div key={i} className="relative h-2.5 w-full">
            <div
              style={{
                width: ln.w,
                height: "100%",
                borderRadius: 3,
                background: "rgba(148,163,184,0.28)",
              }}
            />
            {ln.mark && (
              <div
                style={{
                  position: "absolute",
                  top: -1,
                  left: ln.mark.left,
                  width: ln.mark.w,
                  height: "calc(100% + 2px)",
                  borderRadius: 3,
                  background: "rgba(251,191,36,0.42)",
                  boxShadow: "0 0 0 1px rgba(251,191,36,0.7)",
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 三枚策略徽章 */}
      <div className="mt-1 flex gap-1.5">
        {[
          { t: "position", c: "52,211,153" },
          { t: "exact", c: "56,189,248" },
          { t: "fuzzy", c: "251,191,36" },
        ].map((b) => (
          <span
            key={b.t}
            style={{
              fontSize: 9,
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: 4,
              color: `rgb(${b.c})`,
              background: `rgba(${b.c},0.14)`,
              boxShadow: `inset 0 0 0 1px rgba(${b.c},0.32)`,
            }}
          >
            {b.t}
          </span>
        ))}
      </div>
    </div>
  );
}
