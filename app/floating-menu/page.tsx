import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FloatingMenu } from "./floating-menu";

const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/floating-menu" },
  { label: "About", href: "/floating-menu" },
  { label: "Contact", href: "/floating-menu" },
];

const secondaryLinks = [
  { label: "Blog", href: "/floating-menu" },
  { label: "Projects", href: "/floating-menu" },
  { label: "Uses", href: "/floating-menu" },
];

const socialLinks = [
  { label: "GitHub", href: "https://github.com" },
  { label: "X", href: "https://x.com" },
];

export default function FloatingMenuPage() {
  return (
    <div className="dark min-h-screen bg-neutral-900 text-neutral-100">
      <FloatingMenu
        primaryLinks={primaryLinks}
        secondaryLinks={secondaryLinks}
        socialLinks={socialLinks}
      />

      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-neutral-100"
        >
          <ArrowLeft size={15} />
          playground
        </Link>

        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">
            Floating Menu
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            顶部悬浮胶囊菜单：点击 Menu 后以弹簧动画展开为大尺寸导航面板，
            大号 primary 链接 + secondary 分组 + 社交链接三段式布局，
            展开时汉堡图标同步变形成关闭叉号，点击面板外任意处自动收起。
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            基于 React、Tailwind CSS 与 Framer Motion。滚动页面，菜单会一直固定在顶部。
          </p>
        </header>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-800/50 p-5 text-sm leading-7 text-neutral-400">
          <p>
            这里的正文只是占位内容，用来验证菜单的 fixed 定位与展开遮罩行为：
            展开状态下继续滚动页面，菜单始终悬浮在视口顶部；
            点击页面任意空白区域，菜单会自动收起回胶囊形态。
          </p>
          <p className="mt-3">
            primaryLinks 渲染为 32px 大字号标题链接，secondaryLinks 是常规分组，
            socialLinks 以外链形式在新标签页打开。三组链接均为可选，
            传入空数组时对应分组自动隐藏。
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-800/50 p-5 text-sm leading-7 text-neutral-400">
          <h2 className="mb-3 text-base font-semibold text-neutral-100">
            动画风格 · 弹簧物理动画（Spring / Physics-based Motion）
          </h2>
          <p>
            这类风格属于 Apple「Fluid Interfaces」与 Material Design「natural motion」一脉的现代 Web 动效，
            iOS Dynamic Island、Arc 浏览器、Linear 的菜单展开都是同一族。
            一句话描述：单一容器在「胶囊」与「大面板」两种状态间连续形变（morph），
            全程由弹簧物理驱动而非固定时长缓动曲线；内容子项以错峰编排（stagger）浮入浮出，
            辅以 hover 位移、按压缩放等微交互，以及 SVG path 插值的图标变形。
          </p>
          <h3 className="mt-4 mb-2 text-sm font-medium text-neutral-200">主要元素（对应组件里的具体实现）</h3>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <span className="font-medium text-neutral-200">Spring 物理参数</span>
              -- stiffness 280~350 / damping 18~35。展开稍软（280/26）有回弹感，
              收起更硬更干脆（300/35），链接 hover 用低阻尼（18）所以会轻微过冲。
            </li>
            <li>
              <span className="font-medium text-neutral-200">容器形变（morphing）</span>
              -- 同一个元素动画 width / height / padding（320×56 -&gt; 380×700），
              视觉上是「长出来」的，而不是弹出一个新弹窗。这是它与普通 dropdown 的本质区别。
            </li>
            <li>
              <span className="font-medium text-neutral-200">错峰编排（stagger / choreography）</span>
              -- 展开时 delayChildren 0.05 + staggerChildren 0.02 逐条浮入；
              关闭时 staggerDirection: -1 反向 + when: &quot;afterChildren&quot;（子项先退完、容器再收）。
            </li>
            <li>
              <span className="font-medium text-neutral-200">入场单元动作</span>
              -- 每项都是 opacity 0-&gt;1 + y 12-&gt;0（从下方浮入），目前最流行的入场范式。
            </li>
            <li>
              <span className="font-medium text-neutral-200">微交互（micro-interactions）</span>
              -- 大链接 hover x: +6、小链接 +4、按钮 active:scale-95、标题栏 whileTap: 0.98，制造「可按压」的触觉感。
            </li>
            <li>
              <span className="font-medium text-neutral-200">图标 morph</span>
              -- 汉堡 ↔ 叉号靠两条 motion.path 的 d 属性插值，两帧之间平滑变形。
            </li>
            <li>
              <span className="font-medium text-neutral-200">色彩过渡并行</span>
              -- 容器背景 / 边框用 300ms transition-colors 渐显，和弹簧形变同时发生，
              层次感来自「快的弹性 + 慢的渐变」叠加。
            </li>
          </ol>
          <p className="mt-4">
            设计文档归类关键词：spring-driven morphing + staggered choreography + tactile
            micro-interactions，中文可以叫「弹簧形变 + 错峰编排 + 触觉微交互」。
          </p>
        </section>
      </div>
    </div>
  );
}
