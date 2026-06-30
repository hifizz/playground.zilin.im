"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { SLIDES } from "./slides";

const bgVariants: Variants = {
  enter: { opacity: 0, scale: 1.08 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.03 },
};

const contentVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 44 : -44 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -44 : 44 }),
};

/** 右侧价值轮播：底图 crossfade + 文案滑入 + 卖点逐条出现 + 圆点导航 */
export function Carousel() {
  const [[index, dir], setState] = useState<[number, number]>([0, 1]);
  const [paused, setPaused] = useState(false);
  const len = SLIDES.length;

  const paginate = useCallback(
    (next: number, direction: number) => setState([(next + len) % len, direction]),
    [len]
  );

  // 自动翻页：每 6s 前进一页，悬停暂停；按 index 重置计时
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => paginate(index + 1, 1), 6000);
    return () => clearTimeout(t);
  }, [index, paused, paginate]);

  const slide = SLIDES[index];

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* 底图：crossfade + 缓慢放大 */}
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          custom={dir}
          variants={bgVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
          style={{ background: slide.base }}
        >
          {/* 模糊光斑 */}
          <div
            className="absolute -left-16 -top-10 h-64 w-64 rounded-full blur-2xl"
            style={{ background: slide.blobA, opacity: 0.85 }}
          />
          <div
            className="absolute -bottom-20 right-[-10%] h-72 w-72 rounded-full blur-2xl"
            style={{ background: slide.blobB, opacity: 0.8 }}
          />
          {/* 旋转钻石切面 */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-[120%] w-[70%]"
            style={{
              background: slide.facet,
              borderRadius: 56,
              translateX: "-50%",
              translateY: "-50%",
            }}
            animate={{ rotate: [38, 44, 38] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* 暗角，保证文字可读 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/35" />
        </motion.div>
      </AnimatePresence>

      {/* 文案层：随页切换滑入，卖点逐条出现 */}
      <div className="relative flex h-full flex-col justify-center px-7 py-10 sm:px-12">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={index}
            custom={dir}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="max-w-[16ch] text-2xl font-semibold leading-snug tracking-tight text-white sm:text-[30px] sm:leading-[1.25]">
              {slide.title}
            </h3>

            <ul className="mt-8 flex flex-col gap-4">
              {slide.bullets.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.07, duration: 0.4, ease: "easeOut" }}
                    className="flex items-start gap-3 text-[13.5px] leading-relaxed text-white/90"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/15 text-white backdrop-blur-sm">
                      <Icon size={14} />
                    </span>
                    <span>{b.text}</span>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        </AnimatePresence>

        {/* 圆点导航 */}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2.5">
          {SLIDES.map((_, i) => {
            const active = i === index;
            return (
              <button
                key={i}
                aria-label={`第 ${i + 1} 页`}
                onClick={() => paginate(i, i > index ? 1 : -1)}
                className="flex items-center justify-center"
              >
                {active ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/70">
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40 transition-colors hover:bg-white/70" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
