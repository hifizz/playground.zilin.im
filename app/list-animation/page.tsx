"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";

const makeCard = (id: number) => ({
  id,
  title: `Card ${id}`,
  desc: `This card was inserted at the top with a spring animation.`,
});

type EnterMode = "left" | "top" | "right";
type SpringPreset = "soft" | "snappy" | "bouncy";
type EnterEffect = "none" | "scale" | "scale-fade" | "pop";

const springMap: Record<
  SpringPreset,
  { stiffness: number; damping: number; mass: number }
> = {
  soft: { stiffness: 180, damping: 24, mass: 1 },
  snappy: { stiffness: 420, damping: 34, mass: 0.9 },
  bouncy: { stiffness: 320, damping: 18, mass: 0.85 },
};

const buttonBase =
  "rounded-2xl px-3 py-2 text-sm font-medium transition active:scale-[0.98]";

export default function AnimatedTopInsertList() {
  const [count, setCount] = useState(4);
  const [items, setItems] = useState([
    makeCard(4),
    makeCard(3),
    makeCard(2),
    makeCard(1),
  ]);

  const [enterMode, setEnterMode] = useState<EnterMode>("left");
  const [springPreset, setSpringPreset] = useState<SpringPreset>("snappy");
  const [fadeEnabled, setFadeEnabled] = useState(true);
  const [enterEffect, setEnterEffect] = useState<EnterEffect>("scale");

  const addToTop = () => {
    const next = count + 1;
    setCount(next);
    setItems((prev) => [makeCard(next), ...prev]);
  };

  const spring = springMap[springPreset];

  const initialVariant = useMemo(() => {
    const shouldFade =
      fadeEnabled || enterEffect === "scale-fade" || enterEffect === "pop";

    let scale = 1;
    if (enterEffect === "scale") scale = 0.96;
    if (enterEffect === "scale-fade") scale = 0.92;
    if (enterEffect === "pop") scale = 0.82;

    const base = {
      opacity: shouldFade ? 0 : 1,
      scale,
      x: 0,
      y: 0,
    };

    if (enterMode === "left") return { ...base, x: -90, y: -6 };
    if (enterMode === "right") return { ...base, x: 90, y: -6 };
    return { ...base, x: 0, y: -70 };
  }, [enterMode, fadeEnabled, enterEffect]);

  const animateVariant = {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
  };

  const exitVariant = {
    opacity: 0,
    x: 40,
    scale: 0.96,
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Animated List
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Top Insert Spring Cards
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                可切换入场方向、spring
                风格、EnterEffect，以及淡入效果，方便直接比较不同动画手感。
                EnterEffect 现在支持 none、scale、scale-fade 和 pop。
              </p>
            </div>

            <button
              onClick={addToTop}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add card to top
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Enter Direction
              </p>
              <div className="flex flex-wrap gap-2">
                {(["left", "top", "right"] as EnterMode[]).map((mode) => {
                  const active = enterMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setEnterMode(mode)}
                      className={`${buttonBase} ${
                        active
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Spring Preset
              </p>
              <div className="flex flex-wrap gap-2">
                {(["soft", "snappy", "bouncy"] as SpringPreset[]).map(
                  (preset) => {
                    const active = springPreset === preset;
                    return (
                      <button
                        key={preset}
                        onClick={() => setSpringPreset(preset)}
                        className={`${buttonBase} ${
                          active
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Enter Effect
              </p>
              <div className="flex flex-wrap gap-2">
                {(["none", "scale", "scale-fade", "pop"] as EnterEffect[]).map(
                  (effect) => {
                    const active = enterEffect === effect;
                    return (
                      <button
                        key={effect}
                        onClick={() => setEnterEffect(effect)}
                        className={`${buttonBase} ${
                          active
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {effect}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Extra Effects
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFadeEnabled((v) => !v)}
                  className={`${buttonBase} ${
                    fadeEnabled
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Fade {fadeEnabled ? "On" : "Off"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <LayoutGroup>
          <motion.div layout className="space-y-4">
            <AnimatePresence initial={false} mode="popLayout">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={initialVariant}
                  animate={animateVariant}
                  exit={exitVariant}
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: spring.stiffness,
                      damping: spring.damping,
                      mass: spring.mass,
                    },
                    opacity: {
                      duration:
                        fadeEnabled ||
                        enterEffect === "scale-fade" ||
                        enterEffect === "pop"
                          ? 0.22
                          : 0.01,
                    },
                    x: {
                      type: "spring",
                      stiffness: spring.stiffness,
                      damping: spring.damping,
                      mass: spring.mass,
                    },
                    y: {
                      type: "spring",
                      stiffness: spring.stiffness,
                      damping: spring.damping,
                      mass: spring.mass,
                    },
                    scale: {
                      type: "spring",
                      stiffness:
                        enterEffect === "pop"
                          ? Math.max(260, spring.stiffness + 30)
                          : Math.max(220, spring.stiffness - 20),
                      damping:
                        enterEffect === "pop"
                          ? Math.max(12, spring.damping - 6)
                          : Math.max(16, spring.damping - 2),
                      mass: spring.mass,
                    },
                  }}
                  className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                          #{item.id}
                        </span>
                        {index === 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                            <Sparkles className="h-3.5 w-3.5" />
                            New top item
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>

        <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
          <p>
            现在你可以切换入场方向、spring 强度、EnterEffect 和附加效果，其中
            EnterEffect 支持 none、scale、scale-fade、pop。 下方旧卡片仍然通过{" "}
            <code>layout</code> 先平滑下移，再让新卡片进入顶部预留空间。
          </p>
        </div>
      </div>
    </div>
  );
}
