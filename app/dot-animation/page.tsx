"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

type Direction = "ccw" | "cw";
type StartCorner = "topRight" | "topLeft" | "bottomLeft" | "bottomRight";

type GridConfig = {
  gridSize: number;
  speed: number;
  startCorner: StartCorner;
  direction: Direction;
  dotSize: number;
  gap: number;
  trailLength: number;
  cycleDelay: number;
};

type Preset = {
  label: string;
  sub: string;
  c: Omit<GridConfig, "cycleDelay"> & { cycleDelay?: number };
};

const INITIAL_CONFIG: GridConfig = {
  gridSize: 3,
  speed: 180,
  startCorner: "topRight",
  direction: "ccw",
  dotSize: 8,
  gap: 7,
  trailLength: 1,
  cycleDelay: 0,
};

const SIZES = [3, 4, 5, 6, 7, 8];
const DIRECTIONS: [Direction, string][] = [
  ["ccw", "↺ CCW"],
  ["cw", "↻ CW"],
];
const CORNERS: [StartCorner, string][] = [
  ["topRight", "↗ TR"],
  ["topLeft", "↖ TL"],
  ["bottomRight", "↘ BR"],
  ["bottomLeft", "↙ BL"],
];

const PRESETS: Preset[] = [
  {
    label: "Classic 3×3",
    sub: "CCW from top-right",
    c: { gridSize: 3, speed: 180, startCorner: "topRight", direction: "ccw", dotSize: 7, gap: 7, trailLength: 1 },
  },
  {
    label: "4×4 Sprint",
    sub: "Fast with short trail",
    c: { gridSize: 4, speed: 110, startCorner: "topRight", direction: "ccw", dotSize: 6, gap: 5, trailLength: 1 },
  },
  {
    label: "5×5 Comet",
    sub: "Long trailing tail",
    c: { gridSize: 5, speed: 85, startCorner: "topLeft", direction: "ccw", dotSize: 5, gap: 5, trailLength: 4 },
  },
  {
    label: "6×6 Calm",
    sub: "Large & meditative",
    c: { gridSize: 6, speed: 200, startCorner: "bottomRight", direction: "ccw", dotSize: 5, gap: 4, trailLength: 2 },
  },
  {
    label: "3×3 CW",
    sub: "Reversed spiral",
    c: { gridSize: 3, speed: 200, startCorner: "topRight", direction: "cw", dotSize: 7, gap: 7, trailLength: 1 },
  },
  {
    label: "4×4 Bottom",
    sub: "Starts bottom-left",
    c: { gridSize: 4, speed: 160, startCorner: "bottomLeft", direction: "ccw", dotSize: 6, gap: 5, trailLength: 2 },
  },
  {
    label: "3×3 Solo",
    sub: "No trail, crisp",
    c: { gridSize: 3, speed: 240, startCorner: "topRight", direction: "ccw", dotSize: 8, gap: 8, trailLength: 0 },
  },
  {
    label: "6×6 Blaze",
    sub: "Maximum speed",
    c: { gridSize: 6, speed: 55, startCorner: "topLeft", direction: "cw", dotSize: 4, gap: 4, trailLength: 3 },
  },
];

function generateSpiralPath(n: number, startCorner: StartCorner, direction: Direction) {
  const CCW: Record<StartCorner, [number, number][]> = {
    topRight: [[0, -1], [1, 0], [0, 1], [-1, 0]],
    topLeft: [[1, 0], [0, 1], [-1, 0], [0, -1]],
    bottomLeft: [[0, 1], [-1, 0], [0, -1], [1, 0]],
    bottomRight: [[-1, 0], [0, -1], [1, 0], [0, 1]],
  };
  const CW: Record<StartCorner, [number, number][]> = {
    topRight: [[1, 0], [0, -1], [-1, 0], [0, 1]],
    topLeft: [[0, 1], [1, 0], [0, -1], [-1, 0]],
    bottomLeft: [[-1, 0], [0, 1], [1, 0], [0, -1]],
    bottomRight: [[0, -1], [-1, 0], [0, 1], [1, 0]],
  };
  const STARTS: Record<StartCorner, [number, number]> = {
    topRight: [0, n - 1],
    topLeft: [0, 0],
    bottomLeft: [n - 1, 0],
    bottomRight: [n - 1, n - 1],
  };
  const dirs = direction === "ccw" ? CCW[startCorner] : CW[startCorner];
  const visited = Array.from({ length: n }, () => Array(n).fill(false));
  const path: number[] = [];
  let [r, c] = STARTS[startCorner];
  let di = 0;

  while (path.length < n * n) {
    if (r < 0 || r >= n || c < 0 || c >= n) break;
    path.push(r * n + c);
    visited[r][c] = true;
    const [dr, dc] = dirs[di];
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < n && nc >= 0 && nc < n && !visited[nr][nc]) {
      r = nr;
      c = nc;
    } else {
      di = (di + 1) % 4;
      const [dr2, dc2] = dirs[di];
      r += dr2;
      c += dc2;
    }
  }

  return path;
}

function buildGrid(
  container: HTMLDivElement,
  n: number,
  dotSize: number,
  gap: number,
  speed: number,
  trailLength: number,
  startCorner: StartCorner,
  direction: Direction,
  cycleDelay: number
) {
  container.innerHTML = "";
  container.style.cssText = `display:grid;grid-template-columns:repeat(${n},${dotSize}px);gap:${gap}px;`;
  const path = generateSpiralPath(n, startCorner, direction);
  const dots: HTMLDivElement[] = [];

  for (let i = 0; i < n * n; i += 1) {
    const dot = document.createElement("div");
    dot.className = "dot-cell";
    dot.style.cssText = `width:${dotSize}px;height:${dotSize}px;background:var(--color-text-primary);opacity:0.12;transition:opacity ${Math.round(speed * 0.55)}ms ease,transform ${Math.round(speed * 0.45)}ms ease;`;
    container.appendChild(dot);
    dots.push(dot);
  }

  let step = 0;
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  function applyStep() {
    for (let i = 0; i < n * n; i += 1) {
      const pos = path.indexOf(i);
      const dist = (step - pos + path.length) % path.length;
      const brightness = dist === 0 ? 1 : dist <= trailLength ? 1 - dist / (trailLength + 1) : 0;
      dots[i].style.opacity = brightness === 0 ? "0.12" : String(0.12 + brightness * 0.88);
      dots[i].style.transform = brightness === 1 ? "scale(1.25)" : "scale(1)";
    }
  }

  function dimAll() {
    dots.forEach((dot) => {
      dot.style.opacity = "0.12";
      dot.style.transform = "scale(1)";
    });
  }

  function schedule() {
    if (cancelled) return;
    step = (step + 1) % path.length;
    applyStep();

    if (step === path.length - 1 && cycleDelay > 0) {
      timerId = setTimeout(() => {
        if (!cancelled) {
          dimAll();
          timerId = setTimeout(schedule, cycleDelay / 2);
        }
      }, cycleDelay / 2);
    } else {
      timerId = setTimeout(schedule, speed);
    }
  }

  applyStep();
  timerId = setTimeout(schedule, speed);

  return () => {
    cancelled = true;
    if (timerId) clearTimeout(timerId);
  };
}

function DotGrid({ config }: { config: GridConfig }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return buildGrid(
      ref.current,
      config.gridSize,
      config.dotSize,
      config.gap,
      config.speed,
      config.trailLength,
      config.startCorner,
      config.direction,
      config.cycleDelay
    );
  }, [
    config.cycleDelay,
    config.direction,
    config.dotSize,
    config.gap,
    config.gridSize,
    config.speed,
    config.startCorner,
    config.trailLength,
  ]);

  return <div ref={ref} />;
}

function PresetCard({ preset, onClick }: { preset: Preset; onClick: () => void }) {
  return (
    <div className="preset-card" onClick={onClick}>
      <DotGrid config={{ ...preset.c, cycleDelay: 0 }} />
      <div>
        <p className="preset-name">{preset.label}</p>
        <p className="preset-sub">{preset.sub}</p>
      </div>
    </div>
  );
}

export default function DotAnimationPage() {
  const [config, setConfig] = useState<GridConfig>(INITIAL_CONFIG);

  const updateNumber = (key: keyof Pick<GridConfig, "speed" | "trailLength" | "dotSize" | "cycleDelay">) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setConfig((current) => ({ ...current, [key]: parseInt(event.target.value, 10) }));
    };

  const applyPreset = (preset: Preset) => {
    setConfig({ ...preset.c, cycleDelay: preset.c.cycleDelay || 0 });
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --color-background-primary: #ffffff;
          --color-background-secondary: #f5f4f0;
          --color-text-primary: #1a1a18;
          --color-text-secondary: #73726c;
          --color-border-tertiary: rgba(0,0,0,0.12);
          --color-border-secondary: rgba(0,0,0,0.22);
          --color-border-primary: rgba(0,0,0,0.35);
          --border-radius-md: 8px;
          --border-radius-lg: 12px;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --color-background-primary: #1a1a18;
            --color-background-secondary: #242422;
            --color-text-primary: #e8e6de;
            --color-text-secondary: #8a8880;
            --color-border-tertiary: rgba(255,255,255,0.10);
            --color-border-secondary: rgba(255,255,255,0.18);
            --color-border-primary: rgba(255,255,255,0.30);
          }
        }

        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: var(--color-background-primary);
          color: var(--color-text-primary);
          padding: 32px 24px 48px;
          max-width: 760px;
          margin: 0 auto;
        }

        h1 { font-size: 20px; font-weight: 500; margin-bottom: 4px; }
        .subtitle { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 36px; }

        .dot-cell { border-radius: 50%; transition: opacity 0.1s ease, transform 0.09s ease; }

        .chip {
          padding: 3px 9px;
          border-radius: var(--border-radius-md);
          border: 0.5px solid var(--color-border-secondary);
          background: transparent;
          color: var(--color-text-secondary);
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.12s, color 0.12s, border-color 0.12s;
        }
        .chip.active {
          background: var(--color-text-primary);
          color: var(--color-background-primary);
          border-color: var(--color-text-primary);
        }

        .stage {
          background: var(--color-background-secondary);
          border-radius: var(--border-radius-lg);
          border: 0.5px solid var(--color-border-tertiary);
          display: flex; align-items: center; justify-content: center;
          padding: 40px; min-height: 160px; margin-bottom: 1.5rem;
        }

        .preset-card {
          background: var(--color-background-primary);
          border: 0.5px solid var(--color-border-tertiary);
          border-radius: var(--border-radius-lg);
          padding: 18px 14px 14px; cursor: pointer;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          transition: border-color 0.15s;
        }
        .preset-card:hover { border-color: var(--color-border-primary); }

        .ctrl-row { display: flex; align-items: center; gap: 10px; }
        .ctrl-lbl { font-size: 12px; color: var(--color-text-secondary); min-width: 80px; }
        .ctrl-val { font-size: 12px; color: var(--color-text-secondary); min-width: 34px; text-align: right; font-variant-numeric: tabular-nums; }
        input[type=range] { flex: 1; accent-color: var(--color-text-primary); }

        .controls-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px; margin-bottom: 1.5rem; }
        .chip-group { display: flex; gap: 5px; flex-wrap: wrap; }
        .section-label { font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px; }
        .presets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
        .preset-name { font-size: 12px; font-weight: 500; color: var(--color-text-primary); text-align: center; }
        .preset-sub { font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; text-align: center; }
        h2 { font-size: 13px; font-weight: 500; margin-bottom: 10px; }
      `}</style>

      <h1>Dot Grid Loader</h1>
      <p className="subtitle">Animated spiral dot grid — configurable grid size, direction, speed and trail.</p>

      <div className="stage"><DotGrid config={config} /></div>

      <div className="controls-grid">
        <div>
          <p className="section-label">Grid size</p>
          <div className="chip-group">
            {SIZES.map((size) => (
              <button
                key={size}
                className={`chip${size === config.gridSize ? " active" : ""}`}
                onClick={() => setConfig((current) => ({ ...current, gridSize: size, gap: Math.max(3, 8 - size) }))}
              >
                {size}×{size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="section-label">Direction</p>
          <div className="chip-group">
            {DIRECTIONS.map(([direction, label]) => (
              <button
                key={direction}
                className={`chip${direction === config.direction ? " active" : ""}`}
                onClick={() => setConfig((current) => ({ ...current, direction }))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="section-label">Start corner</p>
          <div className="chip-group">
            {CORNERS.map(([corner, label]) => (
              <button
                key={corner}
                className={`chip${corner === config.startCorner ? " active" : ""}`}
                onClick={() => setConfig((current) => ({ ...current, startCorner: corner }))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="ctrl-row">
            <span className="ctrl-lbl">Speed</span>
            <input type="range" min="40" max="600" step="10" value={config.speed} onChange={updateNumber("speed")} />
            <span className="ctrl-val">{config.speed} ms</span>
          </div>
          <div className="ctrl-row">
            <span className="ctrl-lbl">Trail</span>
            <input type="range" min="0" max="8" step="1" value={config.trailLength} onChange={updateNumber("trailLength")} />
            <span className="ctrl-val">{config.trailLength}</span>
          </div>
          <div className="ctrl-row">
            <span className="ctrl-lbl">Dot size</span>
            <input type="range" min="3" max="14" step="1" value={config.dotSize} onChange={updateNumber("dotSize")} />
            <span className="ctrl-val">{config.dotSize} px</span>
          </div>
          <div className="ctrl-row">
            <span className="ctrl-lbl">间隔时间</span>
            <input type="range" min="0" max="2000" step="50" value={config.cycleDelay} onChange={updateNumber("cycleDelay")} />
            <span className="ctrl-val">{config.cycleDelay} ms</span>
          </div>
        </div>
      </div>

      <h2>Presets</h2>
      <div className="presets-grid">
        {PRESETS.map((preset) => (
          <PresetCard key={preset.label} preset={preset} onClick={() => applyPreset(preset)} />
        ))}
      </div>
    </>
  );
}
