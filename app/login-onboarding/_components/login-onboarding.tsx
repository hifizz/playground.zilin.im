"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { LeftView } from "./types";
import { ViewSwitcher } from "./view-switcher";
import { ModuleShell } from "./module-shell";
import { WelcomeModule } from "./welcome-module";
import { LoginCard } from "./login-card";
import { SignupCard } from "./signup-card";
import { Carousel } from "./carousel";
import { BrowserChrome } from "./browser-chrome";

/**
 * ============================================================================
 * Build an Agent · 01 — Login Onboarding（编排层）
 * ============================================================================
 * 复刻 Gemini Enterprise 登录页：左「品牌 / 表单」+ 右「价值轮播」。
 *
 *  · 持有共享状态：当前视图 view、邮箱 email。
 *  · 左侧「欢迎」模块可被替换为 login / signup 卡片（AnimatePresence 切换）。
 *  · 右侧轮播见 carousel.tsx，配色全程回避蓝紫渐变。
 *
 * 各小块已拆分到 ./_components 下，按文件名各自维护。
 * ============================================================================
 */
export default function LoginOnboarding() {
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
        <ViewSwitcher value={view} onChange={setView} />

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
