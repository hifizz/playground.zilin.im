"use client";

// 交互图纸：SVG 由 harness-scene 每帧生成字符串后直接写入（rAF 高频路径，不进 React 状态）。
// hover/pin 状态由父组件持有并通过 props 传入；轨道旋转、拆解滑杆与播放动画是本组件的内部状态。
import { useCallback, useEffect, useRef } from "react";
import Linework from "../scene/linework.bundle";
import type { SceneView } from "../scene/linework.bundle";
import { VIEW, VIEWBOX, anchors, draw as drawScene } from "../scene/harness-scene";
import { MODULE_INFO, isModuleId, num } from "../data/module-info";
import type { ModuleId } from "../data/module-info";

const VB = VIEWBOX.split(/\s+/).map(Number);

interface StageProps {
  active: ModuleId | null;
  pinnedId: ModuleId | null;
  onHover: (id: ModuleId | null) => void;
  onPin: (id: ModuleId) => void;
  onUnpin: () => void;
}

export default function Stage({ active, pinnedId, onHover, onPin, onUnpin }: StageProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const tagIdRef = useRef<HTMLElement>(null);
  const tagTextRef = useRef<HTMLElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  const activeRef = useRef(active);
  const viewRef = useRef<SceneView>({ ...VIEW });
  const explodeRef = useRef(1);
  const animRef = useRef(0);
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);

  const draw = useCallback(() => {
    const svg = svgRef.current;
    const tag = tagRef.current;
    if (!svg || !tag) return;
    const a = activeRef.current;
    const props = { explode: explodeRef.current, active: a };
    let out = drawScene(viewRef.current, props);
    if (a) {
      const [x, y] = anchors(viewRef.current, props)[a];
      out +=
        `<circle class="x-leader-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5"/>` +
        `<path class="x-leader" d="M${x.toFixed(1)} ${y.toFixed(1)} L${(x + 22).toFixed(1)} ${(y - 14).toFixed(1)} L${(x + 48).toFixed(1)} ${(y - 14).toFixed(1)}"/>`;
      const left = ((x + 50 - VB[0]) / VB[2]) * 100;
      tag.style.left = left + "%";
      tag.style.top = (y - 14 - VB[1]) / VB[3] * 100 + "%";
      tag.style.maxWidth = `min(260px, calc(${100 - left}% - 2px))`;
      if (tagIdRef.current) tagIdRef.current.textContent = `${num(a)} · ${MODULE_INFO[a].name}`;
      if (tagTextRef.current) tagTextRef.current.textContent = MODULE_INFO[a].hover;
      tag.hidden = false;
    } else {
      tag.hidden = true;
    }
    svg.innerHTML = out;
  }, []);

  const setExplode = useCallback(
    (v: number) => {
      explodeRef.current = v;
      if (sliderRef.current) sliderRef.current.value = String(v);
      draw();
    },
    [draw],
  );

  const play = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setExplode(1);
      return;
    }
    const t0 = performance.now();
    const D = 1200;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / D);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      setExplode(e);
      if (k < 1) animRef.current = requestAnimationFrame(step);
    };
    setExplode(0);
    animRef.current = requestAnimationFrame(step);
  }, [setExplode]);

  // 轨道旋转（含待机摆动）+ 进场拆解动画；卸载时停掉 rAF，StrictMode 双挂载也安全。
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handle = Linework.orbit(svg, {
      view: { ...VIEW },
      onFrame: (v) => {
        viewRef.current = v;
        draw();
      },
      yawRange: [-1.2, 1.2],
      pitchRange: [0.05, 0.6],
    });
    play();
    return () => {
      handle.stop();
      cancelAnimationFrame(animRef.current);
    };
  }, [draw, play]);

  // 父组件的 hover/pin 变化 → 同步到 ref 并重绘高亮与引线标注。
  useEffect(() => {
    activeRef.current = active;
    draw();
  }, [active, draw]);

  function modAt(t: EventTarget | null): ModuleId | null {
    const el = t instanceof Element ? t.closest<HTMLElement>("g[data-mod]") : null;
    const raw = el?.dataset.mod;
    return isModuleId(raw) ? raw : null;
  }

  function endPointer(e: React.PointerEvent) {
    const down = downRef.current;
    if (!down) return;
    const wasTap = !draggingRef.current && Math.hypot(e.clientX - down.x, e.clientY - down.y) <= 6;
    downRef.current = null;
    draggingRef.current = false;
    if (!wasTap || e.type === "pointercancel") return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const id = el && svgRef.current?.contains(el) ? modAt(el) : null;
    if (id) onPin(id);
    else if (pinnedId) onUnpin();
  }

  return (
    <div>
      <div className="x-sheet">
        <div className="x-svgbox">
          <svg
            ref={svgRef}
            viewBox={VB.join(" ")}
            role="img"
            aria-label="Agent Harness 爆炸图：自下而上十三个模块，从模型接入层到评测"
            onPointerOver={(e) => {
              if (e.pointerType === "mouse" && !draggingRef.current) onHover(modAt(e.target));
            }}
            onPointerMove={(e) => {
              if (downRef.current && Math.hypot(e.clientX - downRef.current.x, e.clientY - downRef.current.y) > 6)
                draggingRef.current = true;
              if (e.pointerType === "mouse" && !downRef.current) onHover(modAt(e.target));
            }}
            onPointerLeave={() => {
              if (!downRef.current) onHover(null);
            }}
            onPointerDown={(e) => {
              downRef.current = { x: e.clientX, y: e.clientY };
              draggingRef.current = false;
            }}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
          />
          <div className="x-tag" ref={tagRef} hidden>
            <b ref={tagIdRef} />
            <span ref={tagTextRef} />
          </div>
        </div>
        <p className="x-corner">A–A · 爆炸视图</p>
        <p className="x-titleblock">DWG: HARNESS-001 · REV 0.2 · 2026-11 · SCALE NTS</p>
      </div>
      <div className="x-controls">
        <label className="x-range">
          组装{" "}
          <input
            ref={sliderRef}
            type="range"
            min={0}
            max={1}
            step={0.01}
            defaultValue={1}
            aria-label="组装 ⟷ 拆解"
            onInput={() => {
              cancelAnimationFrame(animRef.current);
              explodeRef.current = parseFloat(sliderRef.current?.value ?? "1");
              draw();
            }}
          />{" "}
          拆解
        </label>
        <button className="x-play" type="button" onClick={play}>
          ▶ 播放拆解
        </button>
        <p className="x-hint">拖动旋转 · 悬停查看 · 点击展开</p>
      </div>
    </div>
  );
}
