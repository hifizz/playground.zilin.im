export function LivelineThumb() {
  // 直接复刻 Liveline 实际渲染出来的样子：暗框 + 一根线 + 右侧 Y 轴标签
  // + 线尾的 pill badge（带左指尾巴）+ pulse dot。不加 marketing 文字。
  // 使用 Liveline 默认 color: #3b82f6。
  const accent = "#3b82f6";

  // 路径用 viewBox 0..200 / 0..100 描，越往右越高（接近 tip 在右上）
  const path =
    "M0,72 L8,68 L18,76 L28,66 L38,70 L48,58 L60,62 L70,50 L80,54 L92,42 L102,46 L114,36 L124,40 L134,32 L146,28 L156,34 L168,22 L180,26 L192,18 L200,20";

  // Y 轴 tick 标签（右侧），等间距
  const yTicks = [
    { y: 18, label: "120" },
    { y: 42, label: "110" },
    { y: 66, label: "100" },
    { y: 90, label: "90" },
  ];

  // tip 坐标（线的最后一个点）
  const tipX = 200;
  const tipY = 20;

  return (
    <div
      className="w-full h-full"
      style={{
        background: "#0a0a0a",
        position: "relative",
        overflow: "hidden",
        // 内边距留给 Y 轴标签和上下呼吸
        padding: "14px 38px 14px 14px",
      }}
    >
      <svg
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: "14px 38px 14px 14px",
          width: "calc(100% - 52px)",
          height: "calc(100% - 28px)",
          overflow: "visible",
        }}
      >
        <defs>
          <linearGradient id="lv-thumb-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* 极淡水平网格线 */}
        {yTicks.map((t) => (
          <line
            key={t.y}
            x1={0}
            x2={200}
            y1={t.y}
            y2={t.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.5}
            shapeRendering="crispEdges"
          />
        ))}

        {/* 区域填充 */}
        <path d={`${path} L${tipX},100 L0,100 Z`} fill="url(#lv-thumb-fill)" />

        {/* 主线 — Liveline 默认 lineWidth: 2 */}
        <path
          d={path}
          stroke={accent}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* tip pulse — 外层晕开 */}
        <circle cx={tipX} cy={tipY} r={6} fill={accent} opacity={0.18} />
        <circle cx={tipX} cy={tipY} r={3.6} fill={accent} opacity={0.42} />
        {/* 实心点 */}
        <circle cx={tipX} cy={tipY} r={1.8} fill="#fff" />
      </svg>

      {/* Y 轴右侧标签 — 跟 Liveline 默认 grid 一样 */}
      <div
        style={{
          position: "absolute",
          right: 6,
          top: 14,
          bottom: 14,
          width: 28,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 8,
          color: "rgba(255,255,255,0.32)",
          letterSpacing: "0.02em",
          textAlign: "right",
          pointerEvents: "none",
        }}
      >
        {yTicks.map((t) => (
          <span key={t.label}>{t.label}</span>
        ))}
      </div>

      {/* badge pill — Liveline 风格：贴在线尾、左侧带尾巴指回线 */}
      {/* tip 在 SVG 里 (200,20)；折算到容器内：右距 = 38px - 0px(tip 在 svg 右沿)
          x = container_width - 38 = 容器右内沿 - Y 轴区
          y 折算: tipY/100 * (h - 28) + 14
          这里直接用 right/top 像素硬定位以保证渲染稳定。 */}
      <div
        style={{
          position: "absolute",
          // 贴近线尾。tip 落在 chart 区右沿、上沿往下约 1/5。
          right: 44,
          top: 23,
          display: "flex",
          alignItems: "center",
          transform: "translateY(-50%)",
        }}
      >
        <div
          style={{
            padding: "2px 7px",
            background: accent,
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            borderRadius: 999,
            letterSpacing: "-0.01em",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            lineHeight: 1.2,
            fontFeatureSettings: "'tnum'",
          }}
        >
          118.4
        </div>
        {/* 尾巴：从 pill 右沿伸出指向线尾 */}
        <svg
          width={5}
          height={6}
          viewBox="0 0 5 6"
          style={{ marginLeft: -0.5, color: accent, display: "block" }}
        >
          <path d="M0,0 L5,3 L0,6 Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
