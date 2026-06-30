"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/**
 * ============================================================================
 * Onboarding · 角落弹出的新功能引导 / Onboarding 卡片
 * ============================================================================
 *
 * 复刻 HeroUI 官网右下角那张 "Build faster with HeroUI Pro" 引导卡片，
 * 并把它做成「可组合 / 可替换 / 可回调」的通用组件。
 *
 * 设计目标（对应需求）：
 *   ① 从网页四个角落任意一个弹出 —— `position` 控制，配 framer-motion 入场动画。
 *   ② 组件化、可替换内部元素 —— 采用「复合组件（compound component）+ slot」模式：
 *        <Onboarding.Root>
 *          <Onboarding.Media>…</Onboarding.Media>     ← 顶部渐变 banner，可整块替换
 *          <Onboarding.Close />                        ← 关闭按钮
 *          <Onboarding.Body>
 *            <Onboarding.Title>…</Onboarding.Title>
 *            <Onboarding.Description>…</Onboarding.Description>
 *            <Onboarding.Footer>
 *              <Onboarding.Action>…</Onboarding.Action>
 *            </Onboarding.Footer>
 *          </Onboarding.Body>
 *        </Onboarding.Root>
 *      每个 slot 都是独立组件，想换哪块换哪块；不传则用默认样式。
 *   ③ 事件回调 —— `onOpenChange` / `onClose` / 各 Action 的 `onClick`。
 *
 * 另外导出一个开箱即用的 <OnboardingBanner>：用 props 直接配 logo / 标题 /
 * 描述 / 两个按钮，内部就是用上面的复合组件拼出来的，适合不想手写结构的场景。
 * ============================================================================
 */

export type OnboardingPosition =
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "top-right";

/** fixed = 贴浏览器视口角落（真实用法）；absolute = 贴最近的定位父元素角落（用于 demo 预览框内） */
export type OnboardingStrategy = "fixed" | "absolute";

// ----------------------------------------------------------------------------
// Context：把 position / 关闭方法 下发给所有 slot 子组件
// ----------------------------------------------------------------------------
type OnboardingContextValue = {
  position: OnboardingPosition;
  close: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error(
      "Onboarding 的子组件必须放在 <Onboarding.Root> 内部使用。",
    );
  }
  return ctx;
}

// ----------------------------------------------------------------------------
// 每个角落对应的 ① 定位样式 ② 入场动画方向
// ----------------------------------------------------------------------------
const POSITION_STYLE: Record<OnboardingPosition, React.CSSProperties> = {
  "bottom-left": { bottom: 0, left: 0 },
  "bottom-right": { bottom: 0, right: 0 },
  "top-left": { top: 0, left: 0 },
  "top-right": { top: 0, right: 0 },
};

const TRANSFORM_ORIGIN: Record<OnboardingPosition, string> = {
  "bottom-left": "bottom left",
  "bottom-right": "bottom right",
  "top-left": "top left",
  "top-right": "top right",
};

/** 从最近的边缘滑入：底部角落往上推，顶部角落往下推 */
function enterOffset(position: OnboardingPosition) {
  const fromBottom = position.startsWith("bottom");
  return { y: fromBottom ? 24 : -24 };
}

// ----------------------------------------------------------------------------
// Root：受控 / 非受控的开关 + 角落定位 + 入场出场动画 + Context provider
// ----------------------------------------------------------------------------
export type OnboardingRootProps = {
  /** 受控开关。传了就由外部完全掌控显示与否 */
  open?: boolean;
  /** 非受控初始值（仅在不传 open 时生效），默认 true */
  defaultOpen?: boolean;
  /** open 变化时回调（关闭按钮 / 受控同步都会触发） */
  onOpenChange?: (open: boolean) => void;
  /** 弹出的角落，默认左下 */
  position?: OnboardingPosition;
  /** 定位策略，默认贴浏览器视口（fixed） */
  strategy?: OnboardingStrategy;
  /** 距离角落两条边的间距（px），默认 24 */
  offset?: number;
  /** 卡片宽度（px），默认 340 */
  width?: number;
  /** 叠放层级，默认 50 */
  zIndex?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

function OnboardingRoot({
  open,
  defaultOpen = true,
  onOpenChange,
  position = "bottom-left",
  strategy = "fixed",
  offset = 24,
  width = 340,
  zIndex = 50,
  className,
  style,
  children,
}: OnboardingRootProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const actualOpen = isControlled ? open : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const close = useCallback(() => setOpen(false), [setOpen]);

  const ctx = useMemo<OnboardingContextValue>(
    () => ({ position, close }),
    [position, close],
  );

  // 角落定位：把 POSITION_STYLE 的 0 替换成 offset
  const cornerStyle: React.CSSProperties = {};
  const pos = POSITION_STYLE[position];
  if ("top" in pos) cornerStyle.top = offset;
  if ("bottom" in pos) cornerStyle.bottom = offset;
  if ("left" in pos) cornerStyle.left = offset;
  if ("right" in pos) cornerStyle.right = offset;

  return (
    <OnboardingContext.Provider value={ctx}>
      <AnimatePresence>
        {actualOpen && (
          <motion.div
            role="dialog"
            aria-modal={false}
            aria-label="Onboarding"
            initial={{ opacity: 0, scale: 0.96, ...enterOffset(position) }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, ...enterOffset(position) }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            style={{
              position: strategy,
              ...cornerStyle,
              transformOrigin: TRANSFORM_ORIGIN[position],
              width,
              zIndex,
              ...style,
            }}
          >
            <div
              className={
                "relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl shadow-black/60 " +
                (className ?? "")
              }
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </OnboardingContext.Provider>
  );
}

// ----------------------------------------------------------------------------
// Media：顶部渐变 banner 区域。默认铺 ProBannerBackground，可整块替换。
// ----------------------------------------------------------------------------
export type OnboardingMediaProps = {
  /** banner 高度（px），默认 200 */
  height?: number;
  /** 背景层（默认是复刻的 HeroUI Pro 渐变 SVG），传 null 可去掉 */
  background?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

function OnboardingMedia({
  height = 200,
  background = <ProBannerBackground />,
  className,
  children,
}: OnboardingMediaProps) {
  return (
    <div
      className={"relative overflow-hidden " + (className ?? "")}
      style={{ height }}
    >
      {background}
      {children != null && (
        <div className="relative flex h-full w-full flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Close：右上角关闭按钮。点击触发 context.close()，并把事件透传给 onClick。
// ----------------------------------------------------------------------------
export type OnboardingCloseProps = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
};

function OnboardingClose({
  onClick,
  className,
  children,
  "aria-label": ariaLabel = "关闭",
}: OnboardingCloseProps) {
  const { close } = useOnboarding();
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(e) => {
        onClick?.(e);
        close();
      }}
      className={
        "absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full text-black/45 transition-colors hover:bg-black/5 hover:text-black/70 " +
        (className ?? "")
      }
    >
      {children ?? <X size={18} strokeWidth={2.2} />}
    </button>
  );
}

// ----------------------------------------------------------------------------
// Body / Title / Description / Footer / Action：纯展示 slot，全部可替换
// ----------------------------------------------------------------------------
function OnboardingBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"flex flex-col gap-2 p-5 " + (className ?? "")}>
      {children}
    </div>
  );
}

function OnboardingTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3
      className={
        "text-[17px] font-semibold leading-snug text-white " + (className ?? "")
      }
    >
      {children}
    </h3>
  );
}

function OnboardingDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={
        "text-[14px] leading-relaxed text-white/55 " + (className ?? "")
      }
    >
      {children}
    </p>
  );
}

function OnboardingFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"mt-3 flex items-center gap-2.5 " + (className ?? "")}>
      {children}
    </div>
  );
}

export type OnboardingActionVariant = "solid" | "outline" | "ghost";

export type OnboardingActionProps = {
  variant?: OnboardingActionVariant;
  /** 点击后是否顺带关闭卡片，默认 false */
  closeOnClick?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children: React.ReactNode;
};

const ACTION_VARIANT: Record<OnboardingActionVariant, string> = {
  // 白底深字（主操作，对应截图里的 "Explore Pro"）
  solid: "bg-white text-black hover:bg-white/90",
  // 描边幽灵（次操作，对应截图里的 "Close"）
  outline: "border border-white/15 text-white/80 hover:bg-white/5",
  ghost: "text-white/60 hover:text-white hover:bg-white/5",
};

function OnboardingAction({
  variant = "outline",
  closeOnClick = false,
  onClick,
  className,
  children,
}: OnboardingActionProps) {
  const { close } = useOnboarding();
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        if (closeOnClick) close();
      }}
      className={
        "flex-1 rounded-full px-4 py-2.5 text-[14px] font-medium transition-colors " +
        ACTION_VARIANT[variant] +
        " " +
        (className ?? "")
      }
    >
      {children}
    </button>
  );
}

// ----------------------------------------------------------------------------
// 默认素材：HeroUI Pro banner 渐变背景（题目给的 SVG）+ Pro 立方体 logo
// ----------------------------------------------------------------------------

/** 题目提供的渐变 banner SVG：浅紫→浅蓝底 + 右上角青紫发光球。id 唯一化避免多实例冲突。 */
export function ProBannerBackground() {
  return (
    <svg
      className="absolute inset-0 size-full -scale-y-100"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 406 328"
      aria-hidden
    >
      <g clipPath="url(#clip0_pro_banner)">
        <g filter="url(#filter0_i_pro_banner)">
          <rect
            fill="url(#paint0_linear_pro_banner)"
            height="365"
            width="406"
            x="0"
            y="0"
          />
        </g>
        <g filter="url(#filter1_f_pro_banner)">
          <path
            d="M301.812 168C361.459 168 409.812 216.353 409.812 276C409.812 335.647 361.459 384 301.812 384C242.166 384 193.813 335.647 193.812 276C193.812 216.353 242.166 168 301.812 168Z"
            fill="url(#paint1_linear_pro_banner)"
          />
        </g>
      </g>
      <defs>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="365"
          id="filter0_i_pro_banner"
          width="406"
          x="0"
          y="0"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            in="SourceGraphic"
            in2="BackgroundImageFix"
            mode="normal"
            result="shape"
          />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feMorphology
            in="SourceAlpha"
            operator="erode"
            radius="12.8125"
            result="effect1_innerShadow_pro_banner"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="80.0781" />
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.728741 0 0 0 0 0.968353 0 0 0 0 1 0 0 0 0.8 0"
          />
          <feBlend
            in2="shape"
            mode="normal"
            result="effect1_innerShadow_pro_banner"
          />
        </filter>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="344.125"
          id="filter1_f_pro_banner"
          width="344.125"
          x="129.75"
          y="103.938"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            in="SourceGraphic"
            in2="BackgroundImageFix"
            mode="normal"
            result="shape"
          />
          <feGaussianBlur
            result="effect1_foregroundBlur_pro_banner"
            stdDeviation="32.0312"
          />
        </filter>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint0_linear_pro_banner"
          x1="203"
          x2="203"
          y1="0"
          y2="365"
        >
          <stop stopColor="#E9E9FF" />
          <stop offset="1" stopColor="#CCE5F1" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint1_linear_pro_banner"
          x1="235.242"
          x2="397.641"
          y1="219.359"
          y2="417.953"
        >
          <stop stopColor="#5DD0E7" />
          <stop offset="1" stopColor="#7300FF" />
        </linearGradient>
        <clipPath id="clip0_pro_banner">
          <rect fill="white" height="328" width="406" />
        </clipPath>
      </defs>
    </svg>
  );
}

/** HeroUI 风格的立方体 logo + "Pro" 字样，默认 banner 内容 */
export function ProLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="40" height="40" viewBox="0 0 32 32" fill="none" aria-hidden>
        <path d="M16 3 L27 9.5 V22.5 L16 29 L5 22.5 V9.5 Z" fill="#4F8FFF" />
        <path d="M16 3 L27 9.5 L16 16 L5 9.5 Z" fill="#7AA3FF" />
        <path d="M16 16 L27 9.5 V22.5 L16 29 Z" fill="#2F6BE0" />
      </svg>
      <span className="text-[40px] font-bold leading-none tracking-tight text-[#3D7BF0]">
        Pro
      </span>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 复合组件命名空间导出
// ----------------------------------------------------------------------------
export const Onboarding = Object.assign(OnboardingRoot, {
  Root: OnboardingRoot,
  Media: OnboardingMedia,
  Close: OnboardingClose,
  Body: OnboardingBody,
  Title: OnboardingTitle,
  Description: OnboardingDescription,
  Footer: OnboardingFooter,
  Action: OnboardingAction,
});

// ============================================================================
// OnboardingBanner · 开箱即用的默认实现（用上面的复合组件拼出来）
// ============================================================================
export type OnboardingActionConfig = {
  label: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** 点击后是否关闭卡片，默认主操作 true */
  closeOnClick?: boolean;
};

export type OnboardingBannerProps = {
  // —— 定位 / 开关（透传给 Root）——
  position?: OnboardingPosition;
  strategy?: OnboardingStrategy;
  offset?: number;
  width?: number;
  zIndex?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  // —— 内容 slot（都可替换）——
  /** banner 区域内容（默认 <ProLogo /> + eyebrow）。传 media 可整块替换顶部 */
  media?: React.ReactNode;
  /** banner 背景层，默认渐变 SVG */
  background?: React.ReactNode;
  /** logo 下方的小字，默认 "Now available" */
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;

  // —— 行为回调 ——
  primaryAction?: OnboardingActionConfig;
  secondaryAction?: OnboardingActionConfig;
  /** 点关闭按钮时触发（在 onOpenChange(false) 之外额外回调） */
  onClose?: () => void;
  /** 是否显示右上角关闭按钮，默认 true */
  showClose?: boolean;

  className?: string;
};

export function OnboardingBanner({
  position = "bottom-left",
  strategy = "fixed",
  offset = 24,
  width = 340,
  zIndex = 50,
  open,
  defaultOpen = true,
  onOpenChange,
  media,
  background,
  eyebrow = "Now available",
  title = "Build faster with HeroUI Pro",
  description = "Components, templates, and AI tooling for React and React Native. Made for teams that care about the details.",
  primaryAction = { label: "Explore Pro" },
  secondaryAction = { label: "Close", closeOnClick: true },
  onClose,
  showClose = true,
  className,
}: OnboardingBannerProps) {
  return (
    <Onboarding.Root
      position={position}
      strategy={strategy}
      offset={offset}
      width={width}
      zIndex={zIndex}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      className={className}
    >
      {showClose && <Onboarding.Close onClick={() => onClose?.()} />}

      <Onboarding.Media background={background}>
        {media ?? (
          <div className="flex flex-col items-center gap-1.5">
            <ProLogo />
            {eyebrow != null && (
              <span className="text-[15px] font-medium text-[#3D7BF0]">
                {eyebrow}
              </span>
            )}
          </div>
        )}
      </Onboarding.Media>

      <Onboarding.Body>
        {title != null && <Onboarding.Title>{title}</Onboarding.Title>}
        {description != null && (
          <Onboarding.Description>{description}</Onboarding.Description>
        )}

        {(primaryAction || secondaryAction) && (
          <Onboarding.Footer>
            {secondaryAction && (
              <Onboarding.Action
                variant="outline"
                closeOnClick={secondaryAction.closeOnClick ?? true}
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Onboarding.Action>
            )}
            {primaryAction && (
              <Onboarding.Action
                variant="solid"
                closeOnClick={primaryAction.closeOnClick ?? false}
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </Onboarding.Action>
            )}
          </Onboarding.Footer>
        )}
      </Onboarding.Body>
    </Onboarding.Root>
  );
}
