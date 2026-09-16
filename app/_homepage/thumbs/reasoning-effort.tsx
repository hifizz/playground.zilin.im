// 纯静态展示，无 state：深色卡片里一个浮在 composer 上方的
// effort 选择面板——四档选项（柱形档位图标），High 行高亮打勾，
// 底部露出 composer 的 pill 触发器与发送键，暗示「弹层调档」。

function Bars({ lit, color }: { lit: number; color: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 10 }}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            width: 2.5,
            height: `${25 + i * 25}%`,
            borderRadius: 1,
            background: color,
            opacity: i < lit ? 1 : 0.22,
          }}
        />
      ))}
    </span>
  );
}

export function ReasoningEffortThumb() {
  const rows = [
    { label: "Low", lit: 1 },
    { label: "Medium", lit: 2 },
    { label: "High", lit: 3, active: true },
    { label: "Max", lit: 4 },
  ];

  return (
    <div
      className="flex h-full w-full items-end justify-center"
      style={{
        background: "linear-gradient(165deg, #0a0a0f 0%, #12121a 55%, #0d0d15 100%)",
      }}
    >
      <div
        style={{
          width: "78%",
          borderRadius: "12px 12px 0 0",
          background: "#141419",
          border: "1px solid rgba(255,255,255,0.09)",
          borderBottom: "none",
          padding: "8px 8px 10px",
        }}
      >
        {/* effort 面板 */}
        <div
          style={{
            borderRadius: 9,
            background: "#1c1c23",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.55)",
            padding: 4,
            marginBottom: 8,
          }}
        >
          {rows.map((r) => (
            <div
              key={r.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "4.5px 7px",
                borderRadius: 6,
                background: r.active ? "rgba(255,255,255,0.09)" : "transparent",
              }}
            >
              <Bars lit={r.lit} color={r.active ? "#fff" : "rgba(255,255,255,0.55)"} />
              <span
                style={{
                  flex: 1,
                  fontSize: 9.5,
                  fontWeight: 500,
                  color: r.active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.5)",
                }}
              >
                {r.label}
              </span>
              {r.active && (
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 6,
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                    <path
                      d="M1.5 4.2 3.2 5.8 6.5 2.4"
                      stroke="#000"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
            </div>
          ))}
        </div>

        {/* composer 行：effort pill + 发送键 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 2px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              padding: "3px 8px",
              fontSize: 9,
              fontWeight: 500,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <Bars lit={3} color="rgba(255,255,255,0.8)" />
            High
          </span>
          <span style={{ flex: 1 }} />
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path
                d="M4 6.5v-5M4 1.5 1.8 3.7M4 1.5l2.2 2.2"
                stroke="#000"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
