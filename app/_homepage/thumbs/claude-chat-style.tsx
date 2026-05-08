export function ClaudeChatStyleThumb() {
  const text = "rgb(18, 18, 18)";
  const muted = "rgba(18, 18, 18, 0.55)";
  const codeColor = "rgb(141, 37, 37)";
  const codeBg = "rgba(55, 55, 52, 0.06)";
  const border = "rgba(31, 31, 30, 0.18)";

  const serif =
    '"Anthropic Serif", Georgia, "Times New Roman", Times, serif';
  const mono =
    'ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace';

  return (
    <div
      className="w-full h-full"
      style={{
        background:
          "radial-gradient(ellipse at top, #f7f4ee 0%, #efe9dd 60%, #e8e1d0 100%)",
        padding: "14px 18px",
        fontFamily: serif,
        color: text,
        display: "flex",
        flexDirection: "column",
        gap: 7,
        overflow: "hidden",
      }}
    >
      {/* H2 */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: "-0.005em",
        }}
      >
        复现 Claude 的回答排版
      </div>

      {/* paragraph */}
      <div style={{ fontSize: 9.5, lineHeight: 1.55, color: text }}>
        正文 16px，行高 1.5。行内代码用{" "}
        <span
          style={{
            fontFamily: mono,
            fontSize: "0.88em",
            color: codeColor,
            background: codeBg,
            border: `0.5px solid ${border}`,
            borderRadius: 3,
            padding: "0px 3px",
          }}
        >
          rgb(141,37,37)
        </span>{" "}
        暗红字。
      </div>

      {/* blockquote */}
      <div
        style={{
          borderLeft: `3px solid rgba(31,31,30,0.18)`,
          paddingLeft: 6,
          color: muted,
          fontSize: 9,
          lineHeight: 1.5,
          fontStyle: "italic",
        }}
      >
        标题 mb -4px，列表用 flex gap …
      </div>

      {/* mini code block */}
      <div
        style={{
          background: "rgba(255,255,255,0.6)",
          border: `0.5px solid ${border}`,
          borderRadius: 5,
          padding: "5px 7px",
          fontFamily: mono,
          fontSize: 8.5,
          lineHeight: 1.55,
          color: "rgb(20, 24, 31)",
        }}
      >
        <div>
          <span style={{ color: "#7a4ea8" }}>--md-text</span>
          <span style={{ color: muted }}>: rgb(18,18,18);</span>
        </div>
        <div>
          <span style={{ color: "#7a4ea8" }}>--md-bg-pre</span>
          <span style={{ color: muted }}>: rgba(255,255,255,.5);</span>
        </div>
      </div>

      {/* tiny table head hint */}
      <div
        style={{
          marginTop: "auto",
          fontSize: 8.5,
          color: muted,
          borderTop: `0.5px solid rgba(31,31,30,0.5)`,
          paddingTop: 3,
          display: "flex",
          gap: 14,
        }}
      >
        <span style={{ fontWeight: 600, color: text }}>p · h2 · pre · table</span>
        <span>1:1 抓自 claude.ai</span>
      </div>
    </div>
  );
}
