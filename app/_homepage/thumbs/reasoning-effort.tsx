export function ReasoningEffortThumb() {
  const keyframes = `
    @keyframes re-thumb-slide {
      /* track: padding 3px + gap 3px，第 k 格左缘 = 3px + k * (25% - 0.75px) */
      0%, 16%   { left: calc(3px + 0%); }
      25%, 41%  { left: calc(3px + 25% - 0.75px); }
      50%, 66%  { left: calc(3px + 50% - 1.5px); }
      75%, 91%  { left: calc(3px + 75% - 2.25px); }
      100%      { left: calc(3px + 0%); }
    }
    @keyframes re-thumb-budget {
      0%, 16%   { width: 14%; }
      25%, 41%  { width: 34%; }
      50%, 66%  { width: 62%; }
      75%, 91%  { width: 100%; }
      100%      { width: 14%; }
    }
    @keyframes re-thumb-breath {
      0%, 100% { opacity: 0.5; }
      50%      { opacity: 1; }
    }
  `;

  const cell = (
    <div
      style={{
        height: 12,
        borderRadius: 4,
        background: "rgba(255,255,255,0.05)",
      }}
    />
  );

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #1b1526 0%, #0b0b10 75%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{keyframes}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 7,
        }}
      >
        {/* popover 面板 */}
        <div
          style={{
            width: 148,
            borderRadius: 9,
            background: "#1a1a21",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 14px 30px -12px rgba(0,0,0,0.7)",
            padding: "7px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {/* 主开关行：brain 点 + 标题线 + switch */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 3,
                background: "#8b5cf6",
                boxShadow: "0 0 8px rgba(139,92,246,0.8)",
                animation: "re-thumb-breath 2.4s ease-in-out infinite",
              }}
            />
            <span
              style={{
                width: 52,
                height: 3.5,
                borderRadius: 2,
                background: "rgba(255,255,255,0.55)",
              }}
            />
            <span
              style={{
                marginLeft: "auto",
                width: 16,
                height: 9,
                borderRadius: 5,
                background: "#8b5cf6",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  right: 1,
                  top: 1,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#fff",
                }}
              />
            </span>
          </div>

          {/* 分段控件：滑块在 Low→Max 间循环 */}
          <div
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 3,
              borderRadius: 6,
              background: "rgba(0,0,0,0.45)",
              padding: 3,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                bottom: 3,
                left: 3,
                /* 格宽 = (track - 2*padding - 3*gap) / 4 = 25% - 3.75px */
                width: "calc(25% - 3.75px)",
                borderRadius: 4,
                background: "rgba(139,92,246,0.35)",
                boxShadow: "inset 0 0 0 1px rgba(167,139,250,0.55)",
                animation: "re-thumb-slide 7s ease-in-out infinite",
              }}
            />
            {cell}
            {cell}
            {cell}
            {cell}
          </div>

          {/* token 预算条：跟随档位变长 */}
          <div
            style={{
              height: 3,
              borderRadius: 2,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 2,
                background:
                  "linear-gradient(90deg, #8b5cf6, #e879f9)",
                animation: "re-thumb-budget 7s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* composer 触发 pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            borderRadius: 20,
            background: "#14141a",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "5px 7px",
            width: 148,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              borderRadius: 20,
              background: "rgba(139,92,246,0.18)",
              border: "1px solid rgba(167,139,250,0.4)",
              padding: "2.5px 7px",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 2,
                background: "#a78bfa",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 6.5,
                lineHeight: 1,
                color: "#c4b5fd",
              }}
            >
              Thinking · High
            </span>
          </span>
          <span
            style={{
              marginLeft: "auto",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                width: 5,
                height: 1.5,
                borderRadius: 1,
                background: "#0b0b10",
                transform: "rotate(-45deg) translateY(-1px)",
              }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}
