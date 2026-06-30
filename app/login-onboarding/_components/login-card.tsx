"use client";

import { CardHeader } from "./card-header";
import { FieldLabel, PillInput, PrimaryButton, SocialButton } from "./primitives";
import { GoogleIcon, GithubIcon } from "./icons";

/** 模块 2：登录卡片（结构参考给定 LoginForm，汉化 + 暗色化） */
export function LoginCard({
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
