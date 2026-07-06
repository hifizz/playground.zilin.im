"use client";

/**
 * 导览模式：纪录片式自动巡航。
 *
 * - 依次飞往 太阳 → 八大行星 → 哈雷彗星（相机复用场景的 focus 飞行 +
 *   跟随逻辑），每站停留期间相机绕目标缓慢环绕；
 * - 底部电影字幕：站点名大字 + 冷知识打字机输出 + 进度点；
 * - ← / → 手动切换，Esc 或按钮退出；每站自动停留后进入下一站；
 * - 页面在导览时隐藏控制条与面板，交给这里的字幕层。
 */

import { useEffect, useRef, useState } from "react";
import { BODIES } from "./planets";

export type TourApi = {
  focus(id: string | null): void;
  orbitBy(dx: number, dy: number): void;
};

const HOLD_MS = 11000; // 每站停留
const TYPE_MS = 45; // 打字机字速

export function TourLayer({
  active,
  apiRef,
  onExit,
}: {
  active: boolean;
  apiRef: React.RefObject<TourApi | null>;
  onExit(): void;
}) {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const exitRef = useRef(onExit);
  exitRef.current = onExit;

  const stops = BODIES; // 太阳 → 行星 → 哈雷彗星，数据顺序即导览顺序
  const stop = stops[Math.min(idx, stops.length - 1)];

  // 进入/退出导览
  useEffect(() => {
    if (!active) return;
    setIdx(0);
    return () => {
      apiRef.current?.focus(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // 每一站：飞过去 + 打字机 + 停留后自动下一站；相机缓慢环绕
  useEffect(() => {
    if (!active) return;
    const api = apiRef.current;
    if (!api) return;
    const s = stops[Math.min(idx, stops.length - 1)];
    api.focus(s.id);

    setTyped("");
    let ti = 0;
    const typer = setInterval(() => {
      ti++;
      setTyped(s.fact.slice(0, ti));
      if (ti >= s.fact.length) clearInterval(typer);
    }, TYPE_MS);

    const holdTimer = setTimeout(() => {
      if (idx < stops.length - 1) setIdx(idx + 1);
      else exitRef.current();
    }, HOLD_MS);

    // 环绕运镜（focus 的飞行动画期间 orbitBy 会被场景忽略，正好衔接）
    let raf = 0;
    const spin = () => {
      raf = requestAnimationFrame(spin);
      api.orbitBy(0.0011, 0);
    };
    spin();

    return () => {
      clearInterval(typer);
      clearTimeout(holdTimer);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, idx]);

  // 键盘：← → 切站，Esc 退出
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx((i) => Math.min(i + 1, stops.length - 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(i - 1, 0));
      else if (e.key === "Escape") exitRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20">
      {/* 退出按钮（右上） */}
      <button
        onClick={() => exitRef.current()}
        className="pointer-events-auto fixed top-5 right-5 px-3 h-8 rounded-xl border border-white/15 bg-black/45 backdrop-blur-xl text-[11px] text-white/70 hover:text-white transition-colors"
      >
        退出导览 Esc
      </button>

      {/* 电影字幕区 */}
      <div className="bg-gradient-to-t from-black/85 via-black/50 to-transparent px-6 md:px-14 pt-16 pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-baseline gap-3">
            <h2
              className="text-2xl md:text-4xl font-semibold tracking-wide"
              style={{ color: stop.accent }}
            >
              {stop.name}
            </h2>
            <span className="text-xs md:text-sm tracking-[0.25em] text-white/40 uppercase">
              {stop.enName}
            </span>
            <span className="ml-auto text-[11px] tabular-nums text-white/35">
              {idx + 1} / {stops.length}
            </span>
          </div>
          <p className="mt-2 text-[13px] md:text-[15px] leading-relaxed text-white/85 min-h-[3.2em]">
            {typed}
            <span className="animate-pulse text-white/50">▎</span>
          </p>

          {/* 进度点（可点击跳转） */}
          <div className="mt-3 flex items-center gap-2">
            {stops.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIdx(i)}
                title={s.name}
                className="pointer-events-auto w-2 h-2 rounded-full transition-all"
                style={{
                  background: i === idx ? s.accent : "rgba(255,255,255,0.22)",
                  transform: i === idx ? "scale(1.5)" : "scale(1)",
                }}
              />
            ))}
            <span className="ml-3 text-[10px] text-white/30">← → 切换</span>
          </div>
        </div>
      </div>
    </div>
  );
}
