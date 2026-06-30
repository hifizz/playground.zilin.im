/** 表单底部的 reCAPTCHA 与授权代表声明（与原图文案一致） */
export function LegalNote() {
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
