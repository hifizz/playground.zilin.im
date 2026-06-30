"use client";

import { BrandMark } from "./brand-mark";
import { PillInput, PrimaryButton } from "./primitives";
import { LegalNote } from "./legal-note";

/** 模块 1：欢迎（信息架构与原图一致） */
export function WelcomeModule({
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
