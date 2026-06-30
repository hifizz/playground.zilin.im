import { ChevronLeft } from "lucide-react";
import { BrandMark } from "./brand-mark";

/** 登录 / 注册卡片共用的头部：返回按钮 + 品牌标 + 标题 + 副标题 */
export function CardHeader({
  onBack,
  title,
  subtitle,
}: {
  onBack: () => void;
  title: string;
  subtitle: string;
}) {
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
