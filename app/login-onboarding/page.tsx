"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Plug,
  Sparkles,
  ShieldCheck,
  Rocket,
  Workflow,
  BarChart3,
  Network,
  Lock,
  Layers,
  Wand2,
  Building2,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";

/**
 * ============================================================================
 * Build an Agent · 01 — Login Onboarding
 * ============================================================================
 * 复刻 Gemini Enterprise 登录页的信息架构：左「品牌 / 表单」+ 右「价值轮播」。
 *
 *  · 左侧「欢迎」模块可被替换为 login / signup 卡片（AnimatePresence 切换）。
 *  · 右侧轮播完全用 framer-motion 实现：底图 crossfade + 内容滑入 + 圆点导航。
 *  · 全程不使用任何蓝紫色渐变 —— 配色走暖橙 / 翠绿 / 青绿 / 玫红 / 琥珀。
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 右侧轮播数据：每页一组渐变 + 标题 + 卖点列表
// ----------------------------------------------------------------------------
type Bullet = { icon: React.ComponentType<{ size?: number; className?: string }>; text: string };
type Slide = {
  title: string;
  bullets: Bullet[];
  /** 主渐变（底图）*/
  base: string;
  /** 两枚高斯模糊光斑，营造图中的「光面棱角」质感 */
  blobA: string;
  blobB: string;
  /** 旋转方块（钻石切面）的渐变 */
  facet: string;
};

const SLIDES: Slide[] = [
  {
    title: "AI 智能体，为每个员工和工作流赋能",
    bullets: [
      { icon: Plug, text: "无需 IT 介入，也能安全连接 Google Workspace 和 Microsoft 365 等业务应用" },
      { icon: Sparkles, text: "基于公司数据生成分析洞见和内容" },
      { icon: ShieldCheck, text: "您的数据归属于您，我们不会用来训练" },
      { icon: Rocket, text: "预构建代理直接用，还能无代码定制代理" },
      { icon: Workflow, text: "在一个平台上自动执行多步骤、多应用的工作流" },
    ],
    base: "linear-gradient(150deg,#1a1207 0%,#7c2d12 42%,#b91c1c 72%,#f59e0b 100%)",
    blobA: "radial-gradient(circle, rgba(245,158,11,0.85), transparent 70%)",
    blobB: "radial-gradient(circle, rgba(220,38,38,0.7), transparent 70%)",
    facet: "linear-gradient(135deg, rgba(251,191,36,0.55), rgba(190,24,60,0.35))",
  },
  {
    title: "从一句话到落地执行，一步到位",
    bullets: [
      { icon: Wand2, text: "用自然语言下达目标，智能体自行拆解并完成任务" },
      { icon: Layers, text: "跨文档、邮件、表格、工单串联多步骤操作" },
      { icon: BarChart3, text: "执行前预览计划，执行后留存可追溯的过程记录" },
    ],
    base: "linear-gradient(150deg,#04130d 0%,#064e3b 44%,#047857 74%,#34d399 100%)",
    blobA: "radial-gradient(circle, rgba(52,211,153,0.85), transparent 70%)",
    blobB: "radial-gradient(circle, rgba(4,120,87,0.7), transparent 70%)",
    facet: "linear-gradient(135deg, rgba(110,231,183,0.5), rgba(4,120,87,0.35))",
  },
  {
    title: "企业级安全与治理，开箱即用",
    bullets: [
      { icon: Lock, text: "数据加密、权限隔离，沿用你现有的身份与访问策略" },
      { icon: ShieldCheck, text: "完整审计日志，每一次智能体调用都可回溯" },
      { icon: Building2, text: "满足组织合规要求，私有数据不参与模型训练" },
    ],
    base: "linear-gradient(150deg,#06201f 0%,#134e4a 44%,#0d9488 74%,#5eead4 100%)",
    blobA: "radial-gradient(circle, rgba(94,234,212,0.8), transparent 70%)",
    blobB: "radial-gradient(circle, rgba(13,148,136,0.7), transparent 70%)",
    facet: "linear-gradient(135deg, rgba(153,246,228,0.5), rgba(13,148,136,0.35))",
  },
  {
    title: "连接你已经在用的全部工具",
    bullets: [
      { icon: Network, text: "数百个预置连接器，几分钟接入业务系统" },
      { icon: Plug, text: "统一上下文，让智能体读懂跨系统的真实数据" },
      { icon: Workflow, text: "把日常流程沉淀为可复用、可共享的智能体" },
    ],
    base: "linear-gradient(150deg,#1f0a14 0%,#831843 44%,#be123c 74%,#fb923c 100%)",
    blobA: "radial-gradient(circle, rgba(251,146,60,0.8), transparent 70%)",
    blobB: "radial-gradient(circle, rgba(190,18,60,0.7), transparent 70%)",
    facet: "linear-gradient(135deg, rgba(253,164,175,0.5), rgba(190,18,60,0.35))",
  },
  {
    title: "可观测、可度量的智能体运营",
    bullets: [
      { icon: BarChart3, text: "实时看板掌握采用率、成功率与节省的工时" },
      { icon: Rocket, text: "A/B 对比不同提示与配置，持续打磨效果" },
      { icon: Layers, text: "从单点试用平滑扩展到全员规模化部署" },
    ],
    base: "linear-gradient(150deg,#1c1304 0%,#422006 42%,#a16207 72%,#facc15 100%)",
    blobA: "radial-gradient(circle, rgba(250,204,21,0.85), transparent 70%)",
    blobB: "radial-gradient(circle, rgba(161,98,7,0.7), transparent 70%)",
    facet: "linear-gradient(135deg, rgba(254,240,138,0.55), rgba(161,98,7,0.35))",
  },
];

// ----------------------------------------------------------------------------
// 主组件
// ----------------------------------------------------------------------------
type LeftView = "welcome" | "login" | "signup";

export default function LoginOnboardingPage() {
  const [view, setView] = useState<LeftView>("welcome");
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen w-full bg-[#0a0a0b] py-12 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6">
        {/* —— Demo 头部 —— */}
        <header className="flex flex-col gap-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
            Build an Agent · 01
          </div>
          <h1 className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
            Login Onboarding
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-white/50">
            还原 Gemini Enterprise 登录页的信息架构：左侧承载 login / signup，
            可整块替换的卡片用 AnimatePresence 切换；右侧价值轮播由 framer-motion
            驱动（底图 crossfade + 卖点滑入 + 圆点导航）。全程不使用蓝紫色渐变。
          </p>
        </header>

        {/* —— 视图切换器：直观演示「左侧模块可被替换」 —— */}
        <div className="flex w-fit gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {(
            [
              { key: "welcome", label: "Welcome" },
              { key: "login", label: "Login" },
              { key: "signup", label: "Sign up" },
            ] as { key: LeftView; label: string }[]
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={`relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                view === t.key ? "text-neutral-900" : "text-white/55 hover:text-white/90"
              }`}
            >
              {view === t.key && (
                <motion.span
                  layoutId="view-pill"
                  className="absolute inset-0 rounded-full bg-white"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        {/* —— 产品截图框（仿浏览器窗口） —— */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0f] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
          <BrowserChrome />

          <div className="flex flex-col md:h-[640px] md:flex-row">
            {/* 左：品牌 + 可替换表单模块 */}
            <div className="relative flex flex-1 flex-col bg-[#0a0a0b] px-6 py-6 sm:px-10">
              {/* 顶部语言选择器 */}
              <div className="flex justify-center">
                <button className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                  简体中文
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5l3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* 中部：模块切换区 */}
              <div className="flex flex-1 items-center justify-center py-8">
                <div className="w-full max-w-[360px]">
                  <AnimatePresence mode="wait" initial={false}>
                    {view === "welcome" && (
                      <ModuleShell key="welcome">
                        <WelcomeModule
                          email={email}
                          setEmail={setEmail}
                          onContinue={() => setView("login")}
                          onSignup={() => setView("signup")}
                        />
                      </ModuleShell>
                    )}
                    {view === "login" && (
                      <ModuleShell key="login">
                        <LoginCard
                          email={email}
                          setEmail={setEmail}
                          onBack={() => setView("welcome")}
                          onSignup={() => setView("signup")}
                        />
                      </ModuleShell>
                    )}
                    {view === "signup" && (
                      <ModuleShell key="signup">
                        <SignupCard
                          email={email}
                          setEmail={setEmail}
                          onBack={() => setView("welcome")}
                          onLogin={() => setView("login")}
                        />
                      </ModuleShell>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 底部：隐私权 | 条款 */}
              <div className="flex items-center justify-center gap-3 text-[13px] text-white/45">
                <a href="#" className="transition-colors hover:text-white/80">隐私权</a>
                <span className="text-white/15">|</span>
                <a href="#" className="transition-colors hover:text-white/80">条款</a>
              </div>
            </div>

            {/* 右：framer-motion 价值轮播 */}
            <div className="relative h-72 w-full overflow-hidden md:h-auto md:w-1/2">
              <Carousel />
            </div>
          </div>
        </div>

        <p className="pb-6 text-xs leading-relaxed text-white/30">
          切换上方 <span className="font-mono text-white/45">Welcome / Login / Sign up</span>{" "}
          看左侧模块整块替换；右侧轮播每 6 秒自动翻页，悬停暂停，点圆点可跳转。
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 模块切换的进出场壳：统一左侧三种卡片的动画
// ----------------------------------------------------------------------------
function ModuleShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ----------------------------------------------------------------------------
// 品牌四角星（Gemini sparkle）—— 暖橙渐变，回避蓝紫
// ----------------------------------------------------------------------------
function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#FBBF6B" />
          <stop offset="100%" stopColor="#EF7E54" />
        </linearGradient>
      </defs>
      <path
        d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0Z"
        fill="url(#spark-grad)"
      />
    </svg>
  );
}

// ----------------------------------------------------------------------------
// 通用：药丸输入框 / 主按钮 / 第三方按钮
// ----------------------------------------------------------------------------
function PillInput(props: React.ComponentProps<"input">) {
  return (
    <input
      {...props}
      className="h-12 w-full rounded-full border border-white/15 bg-white/[0.03] px-5 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-amber-400/20"
    />
  );
}

function PrimaryButton({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="h-12 w-full rounded-full bg-neutral-100 text-sm font-semibold text-neutral-900 transition-colors hover:bg-white"
    >
      {children}
    </button>
  );
}

function SocialButton({ children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      type="button"
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-white/15 bg-transparent text-sm font-medium text-white/85 transition-colors hover:bg-white/5"
    >
      {children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.5-1.7 4.4-5.5 4.4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.06-1.1-.16-1.6H12Z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LegalNote() {
  return (
    <div className="flex flex-col gap-3 text-center text-[11px] leading-relaxed text-white/40">
      <p>
        本网站受 reCAPTCHA Enterprise 保护，并适用 Google 的{" "}
        <a href="#" className="underline underline-offset-2 hover:text-white/70">《隐私权政策》</a>{" "}
        及{" "}
        <a href="#" className="underline underline-offset-2 hover:text-white/70">《服务条款》</a>。
      </p>
      <p>继续操作即表示您确认自己是组织的授权代表，并了解此服务仅供企业使用。</p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 模块 1：欢迎（与原图信息架构一致）
// ----------------------------------------------------------------------------
function WelcomeModule({
  email,
  setEmail,
  onContinue,
  onSignup,
}: {
  email: string;
  setEmail: (v: string) => void;
  onContinue: () => void;
  onSignup: () => void;
}) {
  return (
    <div className="flex flex-col">
      <BrandMark />
      <h2 className="mt-6 text-[28px] font-semibold leading-tight tracking-tight">
        欢迎使用
        <br />
        Gemini Enterprise
        <br />
        <span className="text-white/45">Business 版</span>
      </h2>
      <p className="mt-3 text-sm text-white/55">使用您的工作邮箱登录或创建免费试用账号</p>

      <form
        className="mt-7 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          onContinue();
        }}
      >
        <PillInput
          type="email"
          placeholder="工作电子邮件地址"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <PrimaryButton type="submit">继续</PrimaryButton>
      </form>

      <div className="mt-4 text-center text-[13px] text-white/45">
        还没有账号？{" "}
        <button onClick={onSignup} className="text-white/80 underline underline-offset-4 hover:text-white">
          创建免费试用账号
        </button>
      </div>

      <div className="mt-8">
        <LegalNote />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 模块 2：登录卡片（结构参考给定 LoginForm，汉化 + 暗色化）
// ----------------------------------------------------------------------------
function CardHeader({ onBack, title, subtitle }: { onBack: () => void; title: string; subtitle: string }) {
  return (
    <>
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1 text-[13px] text-white/45 transition-colors hover:text-white/80"
      >
        <ChevronLeft size={15} /> 返回
      </button>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <BrandMark size={30} />
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-white/50">{subtitle}</p>
      </div>
    </>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[13px] font-medium text-white/70">{children}</label>;
}

function LoginCard({
  email,
  setEmail,
  onBack,
  onSignup,
}: {
  email: string;
  setEmail: (v: string) => void;
  onBack: () => void;
  onSignup: () => void;
}) {
  return (
    <div className="flex flex-col">
      <CardHeader onBack={onBack} title="登录您的账号" subtitle="输入工作邮箱以登录企业版" />

      <form className="mt-6 flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-2">
          <FieldLabel>邮箱</FieldLabel>
          <PillInput
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <FieldLabel>密码</FieldLabel>
            <a href="#" className="ml-auto text-[13px] text-white/45 underline-offset-4 hover:text-white/80 hover:underline">
              忘记密码？
            </a>
          </div>
          <PillInput type="password" autoComplete="current-password" required />
        </div>

        <PrimaryButton type="submit">登录</PrimaryButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-[12px] text-white/35">
        <span className="h-px flex-1 bg-white/10" />
        或继续以
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="flex flex-col gap-2.5">
        <SocialButton>
          <GoogleIcon /> 使用 Google 登录
        </SocialButton>
        <SocialButton>
          <GithubIcon /> 使用 GitHub 登录
        </SocialButton>
      </div>

      <div className="mt-6 text-center text-[13px] text-white/50">
        还没有账号？{" "}
        <button onClick={onSignup} className="text-white/85 underline underline-offset-4 hover:text-white">
          注册
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 模块 3：注册卡片
// ----------------------------------------------------------------------------
function SignupCard({
  email,
  setEmail,
  onBack,
  onLogin,
}: {
  email: string;
  setEmail: (v: string) => void;
  onBack: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="flex flex-col">
      <CardHeader onBack={onBack} title="创建账号" subtitle="14 天免费试用，无需信用卡" />

      <form className="mt-6 flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-2">
          <FieldLabel>姓名</FieldLabel>
          <PillInput type="text" placeholder="你的名字" autoComplete="name" required />
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel>工作邮箱</FieldLabel>
          <PillInput
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel>设置密码</FieldLabel>
          <PillInput type="password" autoComplete="new-password" required />
        </div>

        <PrimaryButton type="submit">
          <span className="inline-flex items-center gap-1.5">
            创建账号 <ArrowRight size={15} />
          </span>
        </PrimaryButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-[12px] text-white/35">
        <span className="h-px flex-1 bg-white/10" />
        或继续以
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="flex flex-col gap-2.5">
        <SocialButton>
          <GoogleIcon /> 使用 Google 注册
        </SocialButton>
        <SocialButton>
          <GithubIcon /> 使用 GitHub 注册
        </SocialButton>
      </div>

      <div className="mt-6 text-center text-[13px] text-white/50">
        已有账号？{" "}
        <button onClick={onLogin} className="text-white/85 underline underline-offset-4 hover:text-white">
          登录
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 右侧轮播（framer-motion）
// ----------------------------------------------------------------------------
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

function Carousel() {
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

// ----------------------------------------------------------------------------
// 仿浏览器顶栏（呼应原始截图的窗口质感）
// ----------------------------------------------------------------------------
function BrowserChrome() {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 bg-[#141416] px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
      </div>
      <div className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-md bg-black/40 px-3 py-1 text-[11px] text-white/40">
        <Lock size={11} />
        auth.business.gemini.google/login
      </div>
      <div className="w-12" />
    </div>
  );
}
