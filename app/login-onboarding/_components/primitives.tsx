import type { ComponentProps, ReactNode } from "react";

/** 药丸形输入框（暗色） */
export function PillInput(props: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className="h-12 w-full rounded-full border border-white/15 bg-white/[0.03] px-5 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-amber-400/20"
    />
  );
}

/** 主操作按钮（浅色实心） */
export function PrimaryButton({ children, ...props }: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="h-12 w-full rounded-full bg-neutral-100 text-sm font-semibold text-neutral-900 transition-colors hover:bg-white"
    >
      {children}
    </button>
  );
}

/** 第三方登录按钮（描边） */
export function SocialButton({ children, ...props }: ComponentProps<"button">) {
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

/** 表单字段标签 */
export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="text-[13px] font-medium text-white/70">{children}</label>;
}
