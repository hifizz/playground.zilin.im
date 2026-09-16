"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Check, ChevronDown, Eye, EyeOff } from "lucide-react";

/**
 * ============================================================================
 * Reasoning Effort 调节面板
 * ============================================================================
 * GPT-5 / Claude 系产品里常见的「思考强度」控件：
 *   - 一个主开关（Extended thinking on / off）
 *   - 四档 effort：low / medium / high / max，档位映射 thinking token 预算
 *   - 附加项：是否在回复里展示思考摘要
 *
 * 组件自包含：内部管理 popover 开关、点击外部关闭、Esc 关闭；
 * 对外只暴露受控的 ReasoningConfig。
 * ============================================================================
 */

export type EffortLevel = "low" | "medium" | "high" | "max";

export type ReasoningConfig = {
  enabled: boolean;
  effort: EffortLevel;
};

export const LEVEL_ORDER: EffortLevel[] = ["low", "medium", "high", "max"];

export type EffortMeta = {
  label: string;
  desc: string;
  /** thinking token 预算 */
  tokens: number;
  /** 演示用的模拟思考时长（ms） */
  ms: number;
  /** 模拟思考轨迹：每档播几步 */
  steps: string[];
  /** 模拟回答：每档给不同详略的段落 */
  answers: string[];
};

export const EFFORTS: Record<EffortLevel, EffortMeta> = {
  low: {
    label: "Low",
    desc: "快速过一遍，适合简单问答与格式化任务。",
    tokens: 2_048,
    ms: 1_400,
    steps: [
      "识别问题类型：经典概念题",
      "直接组织核心结论",
    ],
    answers: [
      "因为两次握手无法让服务端确认「客户端收到了自己的 SYN-ACK」。第三次 ACK 用来同步服务端的初始序号，双方才算都确认了彼此的收发能力。",
    ],
  },
  medium: {
    label: "Medium",
    desc: "默认档。多数问题够用，速度与深度的平衡点。",
    tokens: 8_192,
    ms: 2_600,
    steps: [
      "拆解目标：握手要同时确认双方的收发能力并同步初始序号",
      "推演反例：若只有两次，服务端无法确认客户端收到了 SYN-ACK",
      "组织输出：用「送信回执」类比给出三段式回答",
    ],
    answers: [
      "TCP 是全双工：双方各自需要一对 SYN/ACK 来同步自己的初始序号。前两次握手只覆盖了「客户端 → 服务端」这一个方向。",
      "第三次 ACK 让服务端确认：客户端收到了自己的 SYN-ACK，服务端的序号已被对方认可。缺了它，服务端的初始序号处于「未被确认」状态。",
    ],
  },
  high: {
    label: "High",
    desc: "深入推演。适合调试、架构分析、数学推理。",
    tokens: 24_576,
    ms: 4_200,
    steps: [
      "建模：TCP 全双工，双方各自需要一对 SYN/ACK 同步序号",
      "边界检查：两次握手时服务端序号未被确认，连接处于半开状态",
      "历史原因：防止网络中滞留的旧 SYN 让服务端误开连接（delayed duplicate）",
      "对照工程实现：半连接队列 / accept 队列与三次握手的对应关系",
      "综合成三段式答案",
    ],
    answers: [
      "表层原因：TCP 全双工，两端各需一对 SYN/ACK。第二次握手只确认了客户端的序号，服务端的序号要等第三次 ACK 才算被认可。",
      "更本质的原因：防止「失效的连接请求」复活。一个在网络里滞留的旧 SYN 到达服务端时，若两次就建立连接，服务端会白白分配资源等一个永远不会来的数据；第三次 ACK 让「我确实想连」这件事被显式确认。",
      "工程映射：第三次握手前连接躺在半连接队列（SYN queue），收到 ACK 才进入 accept 队列交给应用——这也是为什么 SYN flood 要打的是第一步。",
    ],
  },
  max: {
    label: "Max",
    desc: "不计成本地想。开放问题、形式化验证、长链条推理。",
    tokens: 65_536,
    ms: 6_000,
    steps: [
      "建模：TCP 全双工，双方各自需要一对 SYN/ACK 同步序号",
      "边界检查：两次握手时服务端序号未被确认，连接处于半开状态",
      "历史原因：防止网络中滞留的旧 SYN 让服务端误开连接（delayed duplicate）",
      "追问反面：为什么不是四次？服务端可以把 SYN 和 ACK 合并成一个包",
      "工程映射：半连接队列 / accept 队列、SYN flood 与 SYN cookie",
      "延伸对照：QUIC 如何把这件事压进 0-RTT",
      "综合成分层答案",
    ],
    answers: [
      "表层：TCP 全双工，两端各需一对 SYN/ACK 来同步各自的初始序号——前两次只完成了客户端方向的确认。",
      "本质：第三次 ACK 让「我确实想连」被显式确认，避免网络里滞留的旧 SYN 让服务端误开连接、空挂资源（delayed duplicate problem）。",
      "反过来问「为什么不是四次」也有信息量：服务端的 SYN 和 ACK 本可拆成两个包，合并成一个只是顺手省掉一次往返，逻辑上其实是「四次握手压缩成三次」。",
      "工程映射：收到 SYN 进半连接队列，收到 ACK 进 accept 队列；SYN flood 攻击打的就是第一步的资源占用，于是有了 SYN cookie——把连接状态编码进序号本身，不在服务端留状态。",
    ],
  },
};

export function formatTokens(n: number) {
  return n >= 1000 ? `${Math.round(n / 1024)}k` : `${n}`;
}

/* -------------------------------------------------------------------------- */
/* 小零件                                                                      */
/* -------------------------------------------------------------------------- */

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative h-5 w-9 flex-none rounded-full transition-colors duration-200 ${
        checked ? "bg-violet-500" : "bg-white/15"
      }`}
    >
      <motion.span
        animate={{ x: checked ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
      />
    </button>
  );
}

/** 信号强度条：把 effort 档位画成 4 根递增高度的柱子 */
export function LevelBars({ level }: { level: EffortLevel }) {
  const idx = LEVEL_ORDER.indexOf(level);
  return (
    <span className="flex h-3.5 items-end gap-[2.5px]">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{ height: 4 + i * 3 }}
          className={`w-[3px] rounded-full ${
            i <= idx ? "bg-current" : "bg-white/15"
          }`}
        />
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* 三种可独立使用的 effort 选择器                                                */
/* -------------------------------------------------------------------------- */

/** ① 分段控件：滑动指示器，适合窄面板 */
export function EffortSegmented({
  value,
  onChange,
  layoutId = "effort-segmented",
}: {
  value: EffortLevel;
  onChange: (v: EffortLevel) => void;
  layoutId?: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-0.5 rounded-xl border border-white/10 bg-black/40 p-1">
      {LEVEL_ORDER.map((lv) => (
        <button
          key={lv}
          type="button"
          onClick={() => onChange(lv)}
          className={`relative rounded-lg px-2 py-1.5 text-[12px] font-medium transition-colors ${
            value === lv ? "text-white" : "text-white/45 hover:text-white/75"
          }`}
        >
          {value === lv && (
            <motion.span
              layoutId={layoutId}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="absolute inset-0 rounded-lg bg-white/12 ring-1 ring-white/20"
            />
          )}
          <span className="relative">{EFFORTS[lv].label}</span>
        </button>
      ))}
    </div>
  );
}

/** ② 描述列表：每行带一句话说明，适合空间充裕的菜单 */
export function EffortList({
  value,
  onChange,
}: {
  value: EffortLevel;
  onChange: (v: EffortLevel) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {LEVEL_ORDER.map((lv) => {
        const m = EFFORTS[lv];
        const active = value === lv;
        return (
          <button
            key={lv}
            type="button"
            onClick={() => onChange(lv)}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
              active
                ? "border-violet-400/40 bg-violet-400/10"
                : "border-transparent hover:bg-white/[0.04]"
            }`}
          >
            <span className={active ? "text-violet-300" : "text-white/40"}>
              <LevelBars level={lv} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-baseline gap-2">
                <span
                  className={`text-[13px] font-medium ${
                    active ? "text-white" : "text-white/75"
                  }`}
                >
                  {m.label}
                </span>
                <span className="font-mono text-[10px] text-white/35">
                  {formatTokens(m.tokens)} tokens
                </span>
              </span>
              <span className="truncate text-[11px] text-white/40">
                {m.desc}
              </span>
            </span>
            {active && (
              <Check size={14} className="flex-none text-violet-300" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** ③ 刻度滑杆：离散 snap，拖动手感接近「调音量」 */
export function EffortSlider({
  value,
  onChange,
}: {
  value: EffortLevel;
  onChange: (v: EffortLevel) => void;
}) {
  const idx = LEVEL_ORDER.indexOf(value);
  const fill = (idx / (LEVEL_ORDER.length - 1)) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        {/* 自绘 track：左段填充渐变，比原生 accent 更可控 */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            animate={{ width: `${fill}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
          />
        </div>
        <input
          type="range"
          min={0}
          max={LEVEL_ORDER.length - 1}
          step={1}
          value={idx}
          onChange={(e) => onChange(LEVEL_ORDER[Number(e.target.value)])}
          className="relative z-10 h-4 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white"
        />
      </div>
      <div className="flex justify-between">
        {LEVEL_ORDER.map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => onChange(lv)}
            className={`text-[10px] font-medium transition-colors ${
              value === lv ? "text-white" : "text-white/35 hover:text-white/65"
            }`}
          >
            {EFFORTS[lv].label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 主组件：触发 pill + popover 面板                                              */
/* -------------------------------------------------------------------------- */

export function ReasoningEffortPanel({
  value,
  onChange,
  showTrace = true,
  onShowTraceChange,
  align = "start",
}: {
  value: ReasoningConfig;
  onChange: (v: ReasoningConfig) => void;
  showTrace?: boolean;
  onShowTraceChange?: (v: boolean) => void;
  /** popover 相对触发按钮的对齐方向 */
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 点击外部 / Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const meta = EFFORTS[value.effort];
  const budgetPct = Math.round((meta.tokens / EFFORTS.max.tokens) * 100);

  return (
    <div ref={rootRef} className="relative">
      {/* —— 触发按钮 —— */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
          value.enabled
            ? "border-violet-400/40 bg-violet-400/10 text-violet-200"
            : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.07] hover:text-white/80"
        }`}
      >
        <Brain size={13} />
        {value.enabled ? `Thinking · ${meta.label}` : "Think"}
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* —— Popover —— */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{ transformOrigin: align === "start" ? "bottom left" : "bottom right" }}
            className={`absolute bottom-full z-30 mb-2 w-[300px] rounded-2xl border border-white/10 bg-[#17171c] p-3 shadow-2xl shadow-black/60 ${
              align === "start" ? "left-0" : "right-0"
            }`}
          >
            {/* 主开关 */}
            <div className="flex items-center gap-2.5 px-1 pb-2.5">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-violet-400/15 text-violet-300">
                <Brain size={15} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[13px] font-medium text-white">
                  Extended thinking
                </span>
                <span className="text-[11px] text-white/40">
                  先推理再作答，换取更深的结果
                </span>
              </div>
              <Switch
                checked={value.enabled}
                onChange={(enabled) => onChange({ ...value, enabled })}
              />
            </div>

            {/* effort 区：关掉时整段折叠 */}
            <AnimatePresence initial={false}>
              {value.enabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-2.5 border-t border-white/[0.06] pt-2.5">
                    <EffortSegmented
                      value={value.effort}
                      onChange={(effort) => onChange({ ...value, effort })}
                      layoutId="panel-effort-seg"
                    />

                    {/* 当前档详情：描述 + token 预算条 */}
                    <div className="rounded-xl bg-black/30 px-3 py-2.5">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.p
                          key={value.effort}
                          initial={{ opacity: 0, y: 3 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -3 }}
                          transition={{ duration: 0.15 }}
                          className="text-[11.5px] leading-snug text-white/55"
                        >
                          {meta.desc}
                        </motion.p>
                      </AnimatePresence>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            animate={{ width: `${budgetPct}%` }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 28,
                            }}
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                          />
                        </div>
                        <span className="font-mono text-[10px] text-white/40">
                          ≤{formatTokens(meta.tokens)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 附加项 */}
            {onShowTraceChange && (
              <div className="mt-1 flex items-center gap-2.5 border-t border-white/[0.06] px-1 pt-2.5">
                <span className="text-white/50">
                  {showTrace ? <Eye size={14} /> : <EyeOff size={14} />}
                </span>
                <span className="flex-1 text-[12px] text-white/65">
                  显示思考摘要
                </span>
                <Switch checked={showTrace} onChange={onShowTraceChange} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
