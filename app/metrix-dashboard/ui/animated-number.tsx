"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/** 进入视口后从 0（或上一个值）缓出到目标值；直接改 textContent，不触发 React 重渲染 */
export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.4,
  delay = 0,
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const current = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    const fmt = (n: number) =>
      `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
    if (reduce) {
      el.textContent = fmt(value);
      current.current = value;
      return;
    }
    const controls = animate(current.current, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (n) => {
        el.textContent = fmt(n);
      },
      onComplete: () => {
        current.current = value;
      },
    });
    return () => {
      current.current = value;
      controls.stop();
    };
  }, [value, inView, reduce, decimals, prefix, suffix, duration, delay]);

  const initial = `${prefix}${(reduce ? value : 0).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  return (
    <span ref={ref} className={className} aria-label={`${prefix}${value.toLocaleString("en-US")}${suffix}`}>
      {initial}
    </span>
  );
}
