// 纯静态展示，无 state：画一颗「平滑外扩 + 圆角顶点」的 tooltip 气泡，
// 悬在一个虚化按钮上方，暗示 demo 的核心交互。

// 与页面同款的 path 构造（精简内联版，参数固定）。
function bubblePath(W: number, H: number, R: number, cx: number, aw: number, ah: number, flare: number, tip: number) {
  const len = Math.hypot(aw, ah) || 1;
  const dlx = -aw / len, dly = ah / len;
  const d = Math.min((tip * ah) / Math.max(aw, 1e-4), len * 0.6);
  const fs = Math.max(0, Math.min(flare, len - d - 2));
  const apexY = H + ah;
  const Trx = cx + (aw / len) * d, Try = apexY - (ah / len) * d;
  const Tlx = cx - (aw / len) * d, Tly = Try;
  const Srx = cx + aw + dlx * fs, Sry = H + dly * fs;
  const Slx = cx - aw - dlx * fs, Sly = Sry;
  const Erx = cx + aw + flare, Elx = cx - aw - flare;
  const c1 = flare * 0.55, c2 = fs * 0.55;
  const f = (n: number) => Number(n.toFixed(2));
  const p = (a: number, b: number) => `${f(a)} ${f(b)}`;
  return [
    `M ${p(R, 0)}`, `L ${p(W - R, 0)}`, `Q ${p(W, 0)} ${p(W, R)}`,
    `L ${p(W, H - R)}`, `Q ${p(W, H)} ${p(W - R, H)}`, `L ${p(Erx, H)}`,
    `C ${p(Erx - c1, H)} ${p(Srx - dlx * c2, Sry - dly * c2)} ${p(Srx, Sry)}`,
    `L ${p(Trx, Try)}`, `A ${f(tip)} ${f(tip)} 0 0 1 ${p(Tlx, Tly)}`, `L ${p(Slx, Sly)}`,
    `C ${p(Slx + dlx * c2, Sly - dly * c2)} ${p(Elx + c1, H)} ${p(Elx, H)}`,
    `L ${p(R, H)}`, `Q ${p(0, H)} ${p(0, H - R)}`, `L ${p(0, R)}`, `Q ${p(0, 0)} ${p(R, 0)}`, "Z",
  ].join(" ");
}

export function SmoothTooltipThumb() {
  const W = 134, H = 50, ah = 11;
  const d = bubblePath(W, H, 14, W / 2, 12, ah, 6, 3.5);

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2"
      style={{ background: "linear-gradient(160deg, #0b0b0d 0%, #17171b 60%, #0d0d10 100%)" }}
    >
      {/* tooltip 气泡 */}
      <div style={{ position: "relative", width: W, height: H + ah }}>
        <svg
          width={W}
          height={H + ah}
          viewBox={`0 0 ${W} ${H + ah}`}
          style={{ display: "block", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.45))" }}
        >
          <path d={d} fill="#fafafa" />
        </svg>
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: W,
            height: H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "#111",
          }}
        >
          Tooltip
        </span>
      </div>

      {/* 下方虚化按钮：暗示 tooltip 悬在它上面 */}
      <div
        style={{
          marginTop: 2,
          padding: "5px 16px",
          borderRadius: 8,
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        保存
      </div>
    </div>
  );
}
