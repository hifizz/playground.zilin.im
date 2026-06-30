"use client";

import { ArrowRight } from "lucide-react";
import { CardHeader } from "./card-header";
import { FieldLabel, PillInput, PrimaryButton, SocialButton } from "./primitives";
import { GoogleIcon, GithubIcon } from "./icons";

/** 模块 3：注册卡片 */
export function SignupCard({
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
