"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Body } from "./planets";

/** 星球科普面板：桌面右侧滑入，移动端底部弹出。实体版与点云版共用。 */
export function InfoPanel({
  body,
  onClose,
}: {
  body: Body | undefined;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {body && (
        <motion.aside
          key={body.id}
          initial={{ x: "110%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "110%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="absolute z-20 right-3 md:right-5 top-auto bottom-20 md:bottom-auto md:top-1/2 md:-translate-y-1/2 w-[calc(100%-24px)] md:w-[340px] max-h-[62vh] md:max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a14]/80 backdrop-blur-2xl shadow-2xl"
          style={{ boxShadow: `0 0 60px -18px ${body.accent}55` }}
        >
          {/* 头部 */}
          <div
            className="px-5 pt-5 pb-4 border-b border-white/8"
            style={{
              background: `linear-gradient(135deg, ${body.accent}26, transparent 60%)`,
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-xl font-semibold">{body.name}</h2>
                  <span className="text-xs tracking-[0.2em] text-white/40 uppercase">
                    {body.enName}
                  </span>
                </div>
                <span
                  className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full border"
                  style={{
                    color: body.accent,
                    borderColor: `${body.accent}66`,
                    background: `${body.accent}14`,
                  }}
                >
                  {body.type}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 grid place-items-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="关闭"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M2 2l8 8M10 2l-8 8" />
                </svg>
              </button>
            </div>
          </div>

          {/* 数据表 */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 text-[13px]">
            {(
              [
                ["直径", body.diameter],
                ["距太阳", body.distance],
                ["公转周期", body.orbitPeriodText],
                ["自转周期", body.rotationPeriodText],
                ["卫星", body.moons],
                ["温度", body.temperature],
                ["轴倾角", body.tiltText],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className={k === "直径" || k === "距太阳" ? "col-span-2" : ""}>
                <dt className="text-[10px] tracking-widest text-white/35 mb-0.5">{k}</dt>
                <dd className="text-white/85 leading-snug">{v}</dd>
              </div>
            ))}
          </dl>

          {/* 冷知识 */}
          <div className="px-5 pb-5">
            <div
              className="rounded-xl px-4 py-3 text-[12.5px] leading-relaxed text-white/75 border"
              style={{ borderColor: `${body.accent}33`, background: `${body.accent}0d` }}
            >
              <span className="mr-1" style={{ color: body.accent }}>
                ✦
              </span>
              {body.fact}
            </div>
            <p className="mt-3 text-[10px] text-white/25 leading-relaxed">
              * 场景中的星球大小与轨道距离为压缩比例；公转/自转的相对快慢、
              轴倾角与自转方向（金星、天王星逆行）按真实数据呈现。
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
