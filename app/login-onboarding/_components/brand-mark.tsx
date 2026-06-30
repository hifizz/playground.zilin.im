/**
 * 品牌四角星（Gemini sparkle）—— 暖橙渐变，刻意回避蓝紫。
 * 同一时刻页面只渲染一个实例，故沿用固定的 gradient id。
 */
export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id="lo-spark-grad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#FBBF6B" />
          <stop offset="100%" stopColor="#EF7E54" />
        </linearGradient>
      </defs>
      <path
        d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0Z"
        fill="url(#lo-spark-grad)"
      />
    </svg>
  );
}
