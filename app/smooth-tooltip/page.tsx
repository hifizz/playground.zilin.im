"use client";

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * ============================================================================
 * Smooth Tooltip · 平滑外扩 + 圆角顶点
 * ============================================================================
 * 整条气泡轮廓用一条 path 画成：凹角外扩(C) · 直斜边(L) · 圆角顶点(A)。
 * 改写自一个独立 playground，套用本仓库 Glyph 页同款 UI（主题 token / 卡片 / Block）。
 * ============================================================================
 */

/* -------------------------------------------------------------------------- */
/* 类型                                                                        */
/* -------------------------------------------------------------------------- */

type Geo = { aw: number; ah: number; flare: number; tip: number; R: number };
type PathGeo = Geo & { W: number; H: number; cx: number };

/* ------------------------------------------------------------------ *
 *  核心：把 面板 + 小三角 画成一条 path
 *
 *  坐标系：面板左上角 (0,0)，宽 W、高 H，小三角朝下，顶点在 (cx, H+ah)。
 *  三种曲线：
 *    ① 凹·外扩  —— 三角根部，三次贝塞尔 C(底边水平切线 → 斜边方向切线)
 *    ② 直斜边    —— 让它仍然「像个三角」，一段 L
 *    ③ 凸·圆角   —— 顶点，圆弧 A，从斜边回退 r/tan(θ) 出切点
 * ------------------------------------------------------------------ */
function buildTooltipPath({ W, H, R, cx, aw, ah, flare, tip }: PathGeo) {
  const len = Math.hypot(aw, ah) || 1;
  // 右侧斜边「下行」单位向量（由根部指向顶点，即向下偏左）
  const dlx = -aw / len;
  const dly = ah / len;

  // 顶点圆角：沿斜边从顶点回退的切线长 d = tip / tan(θ) = tip·ah/aw
  const d = Math.min((tip * ah) / Math.max(aw, 1e-4), len * 0.6);
  // 外扩段沿斜边占用的长度（夹住，别和顶点圆角打架）
  const fs = Math.max(0, Math.min(flare, len - d - 2));

  const apexY = H + ah;
  // 顶点圆弧的两个切点（分别在左右斜边上）
  const Trx = cx + (aw / len) * d, Try = apexY - (ah / len) * d;
  const Tlx = cx - (aw / len) * d, Tly = Try;
  // 外扩曲线与斜边的衔接点（根部往斜边下移 fs）
  const Srx = cx + aw + dlx * fs, Sry = H + dly * fs;
  const Slx = cx - aw - dlx * fs, Sly = Sry;
  // 外扩曲线在底边上的起点（凹角向外铺开 flare 的宽度）
  const Erx = cx + aw + flare, Elx = cx - aw - flare;

  // 控制柄长度
  const c1 = flare * 0.55;          // 底边端，水平
  const c2 = fs * 0.55;             // 斜边端，沿斜边

  const f = (n: number) => Number(n.toFixed(2));
  const p = (a: number, b: number) => `${f(a)} ${f(b)}`;

  const dStr = [
    `M ${p(R, 0)}`,
    `L ${p(W - R, 0)}`,
    `Q ${p(W, 0)} ${p(W, R)}`,                       // 右上角
    `L ${p(W, H - R)}`,
    `Q ${p(W, H)} ${p(W - R, H)}`,                   // 右下角
    `L ${p(Erx, H)}`,                                // 底边·右段
    // ① 右侧外扩：水平切线 → 斜边切线
    `C ${p(Erx - c1, H)} ${p(Srx - dlx * c2, Sry - dly * c2)} ${p(Srx, Sry)}`,
    `L ${p(Trx, Try)}`,                              // ② 右直斜边
    `A ${f(tip)} ${f(tip)} 0 0 1 ${p(Tlx, Tly)}`,    // ③ 顶点圆弧(凸)
    `L ${p(Slx, Sly)}`,                              // ② 左直斜边
    // ① 左侧外扩：斜边切线 → 水平切线
    `C ${p(Slx + dlx * c2, Sly - dly * c2)} ${p(Elx + c1, H)} ${p(Elx, H)}`,
    `L ${p(R, H)}`,                                  // 底边·左段
    `Q ${p(0, H)} ${p(0, H - R)}`,                   // 左下角
    `L ${p(0, R)}`,
    `Q ${p(0, 0)} ${p(R, 0)}`,                       // 左上角
    "Z",
  ].join(" ");

  return {
    d: dStr,
    debug: {
      apex: { x: cx, y: apexY },
      base: [{ x: cx - aw, y: H }, { x: cx + aw, y: H }],
      E: [{ x: Erx, y: H }, { x: Elx, y: H }],
      S: [{ x: Srx, y: Sry }, { x: Slx, y: Sly }],
      T: [{ x: Trx, y: Try }, { x: Tlx, y: Tly }],
    },
  };
}

/* ------------------------------------------------------------------ *
 *  纯形状(svg)。content 通过上层 div 叠在面板区域。
 *  fill 默认 currentColor —— 跟随外层 text-* 颜色，自动适配明暗主题。
 * ------------------------------------------------------------------ */
function TooltipShape({
  W,
  H,
  geo,
  fill = "currentColor",
  debug = false,
  shadow = false,
}: {
  W: number;
  H: number;
  geo: Geo & { cx: number };
  fill?: string;
  debug?: boolean;
  shadow?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const { d, debug: dbg } = buildTooltipPath({ W, H, ...geo });
  const totalH = H + geo.ah;

  return (
    <svg
      width={W}
      height={totalH}
      viewBox={`0 0 ${W} ${totalH}`}
      style={{ display: "block", overflow: "visible" }}
    >
      {shadow && (
        <defs>
          <filter id={`s-${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.18" />
          </filter>
        </defs>
      )}
      <path d={d} style={{ fill }} filter={shadow ? `url(#s-${id})` : undefined} />

      {debug && (
        <g fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke">
          {/* 理想三角(虚线) */}
          <polygon
            points={`${dbg.base[0].x},${dbg.base[0].y} ${dbg.apex.x},${dbg.apex.y} ${dbg.base[1].x},${dbg.base[1].y}`}
            stroke="#22d3ee"
            strokeDasharray="3 3"
            opacity="0.7"
          />
          {dbg.E.map((q, i) => (
            <circle key={`e${i}`} cx={q.x} cy={q.y} r="2.5" fill="#f97316" stroke="none" />
          ))}
          {dbg.S.map((q, i) => (
            <circle key={`s${i}`} cx={q.x} cy={q.y} r="2.5" fill="#22d3ee" stroke="none" />
          ))}
          {dbg.T.map((q, i) => (
            <circle key={`t${i}`} cx={q.x} cy={q.y} r="2.5" fill="#a3e635" stroke="none" />
          ))}
          <circle cx={dbg.apex.x} cy={dbg.apex.y} r="2.5" fill="#f43f5e" stroke="none" />
        </g>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 *  可复用的 Tooltip：测量内容尺寸 → 画形状 → 内容叠在上方。side="top"。
 * ------------------------------------------------------------------ */
function Tooltip({
  label,
  children,
  geo,
  padX = 12,
  padY = 8,
  gap = 8,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  geo: Geo;
  padX?: number;
  padY?: number;
  gap?: number;
}) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [label]);

  const W = Math.max(size.w, 1);
  const H = Math.max(size.h, 1);
  const cx = W / 2;

  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {children}

      {/* 测量层：不可见，只为拿到内容尺寸 */}
      <span
        ref={ref}
        aria-hidden
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          padding: `${padY}px ${padX}px`,
          fontSize: 13,
          fontWeight: 500,
          left: 0,
          top: 0,
        }}
      >
        {label}
      </span>

      <span
        role="tooltip"
        // text-foreground：shape 的 currentColor 取这个；label 单独用 background 反白
        className="text-foreground"
        style={{
          position: "absolute",
          left: "50%",
          bottom: `calc(100% + ${gap}px)`,
          transform: `translateX(-50%) translateY(${open ? 0 : 4}px)`,
          opacity: open ? 1 : 0,
          transition: "opacity .14s ease, transform .14s ease",
          pointerEvents: "none",
          width: W,
          height: H + geo.ah,
        }}
      >
        <span style={{ position: "absolute", inset: 0 }}>
          <TooltipShape W={W} H={H} geo={{ ...geo, cx }} shadow />
        </span>
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
            padding: `${padY}px ${padX}px`,
            color: "var(--background)",
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* 配置：取值范围 / 默认值 / 校验                                                */
/* -------------------------------------------------------------------------- */

const CONFIG_RANGES = {
  aw: [1, 60], ah: [1, 40], flare: [0, 40], tip: [0, 20], R: [0, 28],
  W: [80, 480], H: [28, 200],
} as const;
const CONFIG_DEFAULTS = { aw: 8, ah: 7, flare: 4, tip: 2, R: 8, W: 260, H: 96 };
type Config = typeof CONFIG_DEFAULTS;
const STORAGE_KEY = "smooth-tooltip-config";

// 把任意输入收敛成一份合法配置：挑出已知字段、转数字、夹到范围内
function sanitize(obj: unknown): Config {
  const out: Config = { ...CONFIG_DEFAULTS };
  if (obj && typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    (Object.keys(CONFIG_RANGES) as (keyof Config)[]).forEach((k) => {
      const v = Number(o[k]);
      if (Number.isFinite(v)) {
        const [lo, hi] = CONFIG_RANGES[k];
        out[k] = Math.min(hi, Math.max(lo, v));
      }
    });
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* UI 小件                                                                     */
/* -------------------------------------------------------------------------- */

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-3.5 block">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-foreground"
      />
    </label>
  );
}

const btnClass =
  "inline-flex items-center rounded-lg border bg-muted/40 px-3 py-1.5 text-xs transition-colors hover:bg-muted";

/* 代码块外壳（同 Glyph 页） */
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 text-sm font-medium">{title}</h2>
      <div className="rounded-xl bg-muted/40 p-4">{children}</div>
    </div>
  );
}

/* 构造要点行（同 Glyph 页的 Perf 行） */
function Step({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="w-24 shrink-0 whitespace-nowrap font-medium text-foreground">{k}</span>
      <span className="flex-1">{children}</span>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* 页面                                                                        */
/* -------------------------------------------------------------------------- */

export default function SmoothTooltipPage() {
  const [cfg, setCfg] = useState<Config>(CONFIG_DEFAULTS);
  const [debug, setDebug] = useState(false);
  const [io, setIo] = useState("");
  const [status, setStatus] = useState("");
  const loaded = useRef(false);

  const set = (k: keyof Config) => (v: number) => setCfg((c) => ({ ...c, [k]: v }));
  const geo: Geo = { aw: cfg.aw, ah: cfg.ah, flare: cfg.flare, tip: cfg.tip, R: cfg.R };
  const PW = cfg.W, PH = cfg.H; // 大预览面板尺寸(可调)
  const pcx = PW / 2;

  // —— 持久化：localStorage 跨会话自动保存（best-effort）——
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCfg(sanitize(JSON.parse(raw)));
    } catch {
      /* 无存储 / 解析失败，忽略 */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return; // 等首次加载完成，避免覆盖
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch {
      /* 忽略 */
    }
  }, [cfg]);

  // —— 导入 / 导出 ——
  const exportToBox = () => {
    setIo(JSON.stringify(cfg, null, 2));
    setStatus("已导出到文本框");
  };

  const copyConfig = async () => {
    const text = JSON.stringify(cfg, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setStatus("已复制到剪贴板");
    } catch {
      setIo(text);
      setStatus("剪贴板不可用，已填入文本框，可手动复制");
    }
  };

  const downloadConfig = () => {
    try {
      const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "smooth-tooltip-config.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("已下载 smooth-tooltip-config.json");
    } catch {
      setStatus("下载失败");
    }
  };

  const importFromBox = () => {
    try {
      setCfg(sanitize(JSON.parse(io)));
      setStatus("导入成功");
    } catch {
      setStatus("导入失败：JSON 格式不正确");
    }
  };

  const importFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setIo(text);
      try {
        setCfg(sanitize(JSON.parse(text)));
        setStatus(`已从「${file.name}」导入`);
      } catch {
        setStatus("文件解析失败");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // 允许重复选同一文件
  };

  const reset = () => {
    setCfg(CONFIG_DEFAULTS);
    setStatus("已恢复默认");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-12">
        {/* 返回首页 */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} />
          playground
        </Link>

        {/* 标题区 */}
        <header className="mb-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Smooth Tooltip</h1>
            <span className="rounded-full px-2 py-0.5 text-xs text-muted-foreground">v1.0.0</span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            整条气泡轮廓用一条 path 画成：凹角外扩(C) · 直斜边(L) · 圆角顶点(A)。
            调参实时预览，可导入 / 导出配置，底部有真实悬停示例。
          </p>
        </header>

        {/* 大预览 */}
        <section className="mb-4 flex justify-center rounded-2xl bg-muted/40 p-7">
          <TooltipShape W={PW} H={PH} geo={{ ...geo, cx: pcx }} debug={debug} />
        </section>

        {/* 调参 */}
        <section className="mb-4 grid grid-cols-1 gap-x-7 rounded-2xl bg-muted/40 px-5 py-4 sm:grid-cols-2">
          <Slider label="三角半宽 aw" value={geo.aw} min={1} max={60} onChange={set("aw")} />
          <Slider label="三角高 ah" value={geo.ah} min={1} max={40} onChange={set("ah")} />
          <Slider label="外扩量 flare（凹）" value={geo.flare} min={0} max={40} onChange={set("flare")} />
          <Slider label="顶点圆角 tip（凸）" value={geo.tip} min={0} max={20} step={0.5} onChange={set("tip")} />
          <Slider label="面板圆角 R" value={geo.R} min={0} max={28} onChange={set("R")} />
          <Slider label="预览面板宽 W" value={cfg.W} min={80} max={480} onChange={set("W")} />
          <Slider label="预览面板高 H" value={cfg.H} min={28} max={200} onChange={set("H")} />
          <label className="flex items-center gap-2 self-end pb-3.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={debug}
              onChange={(e) => setDebug(e.target.checked)}
              className="accent-foreground"
            />
            显示构造层（理想三角 / 切点）
          </label>
        </section>

        {/* 导入 / 导出配置 */}
        <section className="mb-4 rounded-2xl bg-muted/40 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">导入 / 导出配置</span>
            <span className="min-h-4 text-xs text-emerald-600 dark:text-emerald-400">{status}</span>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <button onClick={exportToBox} className={btnClass}>导出到文本框</button>
            <button onClick={copyConfig} className={btnClass}>复制 JSON</button>
            <button onClick={downloadConfig} className={btnClass}>下载 .json</button>
            <label className={`${btnClass} cursor-pointer`}>
              上传 .json
              <input
                type="file"
                accept="application/json,.json"
                onChange={importFromFile}
                className="hidden"
              />
            </label>
            <button onClick={reset} className={`${btnClass} ml-auto`}>恢复默认</button>
          </div>

          <textarea
            value={io}
            onChange={(e) => setIo(e.target.value)}
            placeholder={'粘贴配置 JSON，或点「导出到文本框」/「上传 .json」…'}
            spellCheck={false}
            className="min-h-[124px] w-full resize-y rounded-lg border bg-background p-2.5 font-mono text-xs leading-relaxed outline-none focus:border-foreground/30"
          />

          <div className="mt-2.5 flex items-center gap-3">
            <button
              onClick={importFromBox}
              className="inline-flex items-center rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              从文本框导入
            </button>
            <span className="text-xs text-muted-foreground">参数改动会自动保存（刷新不丢失）</span>
          </div>
        </section>

        {/* 真实交互示例 */}
        <section className="mb-12 flex flex-wrap items-center justify-center gap-4 rounded-2xl bg-muted/40 p-7">
          {["保存", "复制链接", "删除这条记录", "?"].map((t, i) => (
            <Tooltip key={i} label={t} geo={geo}>
              <button className={btnClass}>{t}</button>
            </Tooltip>
          ))}
          <p className="mt-2 w-full text-center text-xs text-muted-foreground">
            悬停 / Tab 聚焦上面的按钮看真实 tooltip
          </p>
        </section>

        {/* 构造原理 */}
        <Block title="构造原理">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <Step k="① 凹·外扩">
              三角根部用三次贝塞尔 <code className="font-mono text-xs">C</code>：底边端水平切线、斜边端沿斜边切线，让根部向外平滑铺开 <code className="font-mono text-xs">flare</code>。
            </Step>
            <Step k="② 直斜边">
              中段保留一段直线 <code className="font-mono text-xs">L</code>，让它仍然「像个三角」而非纯水滴。
            </Step>
            <Step k="③ 凸·圆角">
              顶点用圆弧 <code className="font-mono text-xs">A</code>，从斜边回退 <code className="font-mono text-xs">tip·ah/aw</code> 出切点，得到圆润尖角。
            </Step>
            <Step k="一条 path">
              面板四角 + 上面三段全部首尾相接成单条闭合路径，单 <code className="font-mono text-xs">fill</code> 即可，无拼接缝。
            </Step>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            形状随容器 <code className="font-mono text-xs">currentColor</code> 取色，自动适配明暗主题。
          </p>
        </Block>

        {/* 用法 */}
        <Block title="Usage">
          <pre className="overflow-x-auto font-mono text-sm leading-relaxed">
            <code>{`<Tooltip
  label="保存"
  geo={{ aw: ${cfg.aw}, ah: ${cfg.ah}, flare: ${cfg.flare}, tip: ${cfg.tip}, R: ${cfg.R} }}
>
  <button>保存</button>
</Tooltip>`}</code>
          </pre>
        </Block>
      </div>
    </div>
  );
}
