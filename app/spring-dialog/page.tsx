"use client";

import React, { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  useVelocity,
  type Variants,
} from "framer-motion";
import { MousePointerClick, Move, Sparkles, X } from "lucide-react";

type Spring = { stiffness: number; damping: number; mass: number };
type PresetKey = "jelly" | "bouncy" | "soft" | "stiff" | "custom";

const PRESETS: Record<
  Exclude<PresetKey, "custom">,
  { label: string; spring: Spring }
> = {
  jelly: { label: "果冻", spring: { stiffness: 240, damping: 10, mass: 1 } },
  bouncy: { label: "Q弹", spring: { stiffness: 400, damping: 16, mass: 0.9 } },
  soft: { label: "柔和", spring: { stiffness: 170, damping: 22, mass: 1 } },
  stiff: { label: "紧绷", spring: { stiffness: 750, damping: 36, mass: 0.8 } },
};

const buttonBase =
  "rounded-xl px-3 py-1.5 text-[13px] font-medium transition active:scale-[0.97]";

function JellyDialog({
  spring,
  wobble,
  draggable,
  onClose,
}: {
  spring: Spring;
  wobble: boolean;
  draggable: boolean;
  onClose: () => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const vx = useVelocity(x);
  const vy = useVelocity(y);

  const stretchX = useTransform([vx, vy], (latest: number[]) => {
    const [a, b] = latest;
    return wobble
      ? 1 +
          Math.min(Math.abs(a) / 2400, 0.22) -
          Math.min(Math.abs(b) / 9000, 0.09)
      : 1;
  });
  const stretchY = useTransform([vx, vy], (latest: number[]) => {
    const [a, b] = latest;
    return wobble
      ? 1 +
          Math.min(Math.abs(b) / 2400, 0.22) -
          Math.min(Math.abs(a) / 9000, 0.09)
      : 1;
  });
  const lean = useTransform(vx, (v) =>
    wobble ? Math.max(-7, Math.min(7, v / 260)) : 0,
  );

  const panel: Variants = {
    hidden: { opacity: 0, scaleX: 0.5, scaleY: 0.5, y: 96 },
    show: {
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      y: 0,
      transition: {
        scaleX: {
          type: "spring",
          stiffness: spring.stiffness,
          damping: spring.damping,
          mass: spring.mass,
        },
        scaleY: {
          type: "spring",
          stiffness: spring.stiffness * 0.78,
          damping: spring.damping * 0.72,
          mass: spring.mass,
        },
        y: {
          type: "spring",
          stiffness: spring.stiffness * 0.9,
          damping: spring.damping * 1.15,
          mass: spring.mass,
        },
        opacity: { duration: 0.15 },
      },
    },
    leave: {
      opacity: 0,
      scaleX: 0.72,
      scaleY: 0.55,
      y: 44,
      transition: { duration: 0.2, ease: [0.45, 0, 0.8, 0.4] },
    },
  };

  return (
    <motion.div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        drag={draggable}
        dragSnapToOrigin
        dragMomentum={false}
        dragTransition={{
          bounceStiffness: spring.stiffness,
          bounceDamping: spring.damping,
        }}
        style={{ x, y, scaleX: stretchX, scaleY: stretchY, rotate: lean }}
        className="pointer-events-auto cursor-grab active:cursor-grabbing"
      >
        <motion.div
          variants={panel}
          initial="hidden"
          animate="show"
          exit="leave"
          className="w-[min(90vw,400px)] touch-none select-none rounded-[26px] bg-white p-6 shadow-[0_30px_90px_-20px_rgba(97,66,214,0.45),0_2px_8px_rgba(30,20,60,0.08)] ring-1 ring-slate-900/5"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-slate-900">
            果冻弹弹弹
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            这张卡片由两组相位错开的 spring 驱动，所以会边回弹边轻微变形。按住甩出去再松手，它会弹回原位。
          </p>

          <div className="mt-5 flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
            >
              取消
            </button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onClose}
              className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition hover:brightness-105"
            >
              确认
            </motion.button>
          </div>

          {draggable && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Move className="h-3 w-3" />
              按住卡片拖动试试
            </p>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function SpringDialogPage() {
  const [open, setOpen] = useState(true);
  const [preset, setPreset] = useState<PresetKey>("jelly");
  const [custom, setCustom] = useState<Spring>(PRESETS.jelly.spring);
  const [wobble, setWobble] = useState(true);
  const [draggable, setDraggable] = useState(true);

  const spring = preset === "custom" ? custom : PRESETS[preset].spring;

  const updateSpring = (patch: Partial<Spring>) => {
    setCustom({ ...spring, ...patch });
    setPreset("custom");
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f3fa] font-sans text-slate-900 antialiased">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-300/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-fuchsia-300/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-200/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-10 md:pt-14">
        <p className="text-sm font-medium text-violet-500">Spring Dialog</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
          Q弹（Jelly）Dialog
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          进场时 scaleX / scaleY 用两组不同参数的 spring
          收敛到同一目标，相位差产生挤压拉伸的果冻感；打开后按住卡片甩出去，松手按同一组
          spring 弹回中心。
        </p>

        <div className="mt-6 grid gap-5 rounded-3xl bg-white/70 p-5 shadow-sm ring-1 ring-slate-200 backdrop-blur md:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Spring Preset
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((key) => {
                const active = preset === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPreset(key)}
                    className={`${buttonBase} ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {PRESETS[key].label}
                  </button>
                );
              })}
              {preset === "custom" && (
                <button
                  className={`${buttonBase} bg-violet-600 text-white`}
                >
                  自定义
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Spring Params
            </p>
            <div className="space-y-3">
              {(
                [
                  {
                    label: "Stiffness",
                    min: 60,
                    max: 900,
                    step: 10,
                    key: "stiffness" as const,
                  },
                  {
                    label: "Damping",
                    min: 4,
                    max: 60,
                    step: 1,
                    key: "damping" as const,
                  },
                ] as const
              ).map((s) => (
                <label key={s.key} className="block">
                  <span className="mb-1 flex justify-between text-[11px] font-medium text-slate-500">
                    {s.label}
                    <span className="tabular-nums text-slate-700">
                      {Math.round(spring[s.key])}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={spring[s.key]}
                    onChange={(e) =>
                      updateSpring({ [s.key]: Number(e.target.value) })
                    }
                    className="w-full accent-violet-500"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Options
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setWobble((v) => !v)}
                className={`${buttonBase} ${
                  wobble
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                果冻形变 {wobble ? "On" : "Off"}
              </button>
              <button
                onClick={() => setDraggable((v) => !v)}
                className={`${buttonBase} ${
                  draggable
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                拖动回弹 {draggable ? "On" : "Off"}
              </button>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-slate-400">
              调参数后重新打开 Dialog 查看效果；拖动时的形变来自速度映射。
            </p>
          </div>
        </div>

        <div className="flex min-h-[42vh] items-center justify-center">
          <AnimatePresence>
            {!open && (
              <motion.button
                key="trigger"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-slate-900/15"
              >
                <MousePointerClick className="h-4 w-4" />
                打开 Dialog
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[5px]"
          />
        )}
        {open && (
          <JellyDialog
            key="jelly-dialog"
            spring={spring}
            wobble={wobble}
            draggable={draggable}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
