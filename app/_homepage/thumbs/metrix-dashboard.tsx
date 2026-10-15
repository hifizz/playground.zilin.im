// 静态缩略图：像素柱图 + 悬停竖线/圆点/popover 的缩影
const COLS = 22;
const HEIGHTS = [2, 3, 2, 4, 6, 4, 3, 5, 8, 6, 4, 3, 5, 4, 3, 7, 9, 5, 3, 4, 6, 3];

export function MetrixDashboardThumb() {
  const hot = 9;
  return (
    <div className="relative flex h-full w-full items-center justify-center" style={{ background: "#2f2e2d" }}>
      <div className="relative rounded-[8px] p-[2px]" style={{ background: "#252423", width: 200 }}>
        <div className="relative rounded-[6px] border border-white/10 p-3" style={{ background: "#2f2e2d" }}>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 1.5 }}>
            {Array.from({ length: 10 * COLS }, (_, i) => {
              const row = Math.floor(i / COLS);
              const col = i % COLS;
              const lit = 10 - row <= HEIGHTS[col];
              return (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 1,
                    background: lit ? (10 - row <= HEIGHTS[col] * 0.6 ? "#f97316" : "#444341") : "#393837",
                    opacity: col === hot ? 1 : 0.8,
                  }}
                />
              );
            })}
          </div>
          <div
            className="absolute rounded-[5px] border border-white/10 p-[3px]"
            style={{ left: "52%", top: 22, width: 62, background: "linear-gradient(#393837,#2f2e2d)", boxShadow: "0 4px 12px rgba(0,0,0,.4)" }}
          >
            <div className="rounded-[3px] px-1.5 py-1 text-[7px] text-[#979797]" style={{ background: "rgba(255,255,255,.05)" }}>Mar 2025</div>
            <div className="flex items-center gap-1 px-1.5 pt-1 text-[7px] text-[#999]"><i className="size-[3px] rounded-full bg-[#f97316]" />Existing<b className="ml-auto text-[#e5e5e5]">7k</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}
