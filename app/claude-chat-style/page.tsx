import Link from "next/link";
import "./claude-style.css";

export const metadata = {
  title: "Claude Chat Style · playground",
  description:
    "用 claude-style.css 1:1 还原 Claude AI 回答的 Markdown 排版 —— 一篇示范博客。",
};

export default function ClaudeChatStylePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at top, #f7f4ee 0%, #efe9dd 60%, #e8e1d0 100%)",
        padding: "48px 24px 96px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-block",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: 13,
            color: "rgba(18,18,18,0.55)",
            textDecoration: "none",
            marginBottom: 32,
          }}
        >
          ← /playground
        </Link>

        {/* 文章主体 —— 全部走 claude-markdown 样式 */}
        <article className="claude-markdown">
          <h1>用 12 行 CSS 复现 Claude 的回答排版</h1>

          <p>
            <em>2026-05-08 · 排版笔记</em>
          </p>

          <p>
            上周我做了一件挺无聊但挺爽的事：打开 <a href="https://claude.ai">claude.ai</a>，
            让它输出一段含完整 Markdown 元素的回答，然后用 DevTools 把每一个标签的{" "}
            <code>computed style</code> 抓下来，写成一份 ~280 行的 CSS。这篇博客就是用那份
            CSS 渲染的 —— 你看到的字号、行距、列表缩进、引用块边线，每一个数值都是从
            Claude 的真实 DOM 里 1:1 拷贝出来的。
          </p>

          <blockquote>
            <p>
              <strong>TL;DR</strong>：Claude 的排版没有任何"花活"，但它在 4 个细节上做得
              非常克制 —— <em>标题字重 600 而非 700</em>、<em>标题与下方段落收紧 4px</em>、
              <em>列表项之间用 flex gap 控制间距</em>、<em>行内代码用半透明灰底 + 暗红字</em>。
              这 4 件小事加起来，就是一种"安静、易读"的气质。
            </p>
          </blockquote>

          <h2>1. 颜色：克制到几乎察觉不到</h2>

          <p>
            Claude 的正文色是 <code>rgb(18, 18, 18)</code>，几乎是纯黑但又差那么一点点。
            引用块的文字色是 <code>rgb(55, 55, 52)</code>，比正文淡一档。所有边线都是带
            透明度的 <code>rgba(31, 31, 30, X)</code>，X 在 <code>0.1 ~ 0.6</code> 之间浮动。
          </p>

          <p>整理成 design token 后是这样的：</p>

          <pre>
            <code>{`:root {
  --md-text:        rgb(18, 18, 18);
  --md-text-muted:  rgb(55, 55, 52);
  --md-text-code:   rgb(141, 37, 37);   /* 行内代码暗红 */
  --md-border-soft: rgba(31, 31, 30, 0.15);
  --md-bg-pre:      rgba(255, 255, 255, 0.5);
}`}</code>
          </pre>

          <h3>1.1 为什么行内代码用暗红？</h3>

          <p>
            实测 <code>rgb(141, 37, 37)</code> 在浅米色背景上的对比度是 6.8:1，刚好越过
            WCAG AA 的门槛；而它比纯黑多了一点"温度"，又不像鲜红那么刺眼。Claude 显然在
            这件事上调过很多次。
          </p>

          <h2>2. 间距：标题"贴"段落，列表"贴"列表</h2>

          <p>
            最反直觉的一件事：Claude 把所有标题的 <code>margin-bottom</code> 设成了{" "}
            <strong>-4px</strong>。负值。意思是标题会主动"吃掉"一点和下方段落之间的空白：
          </p>

          <ol>
            <li>
              <strong>顶层块</strong>之间的间距用容器的 <code>gap: 12px</code> 统一控制；
            </li>
            <li>
              <strong>标题</strong>是顶层块的特例，它要"咬住"自己介绍的那段文字，所以补 -4px；
            </li>
            <li>
              <strong>列表项</strong>之间用 <code>flex-direction: column; gap: 4px</code>，
              而不是 <code>li</code> 自身的 margin —— 这样嵌套列表收紧到 0 也很自然。
              <ul>
                <li>嵌套 <code>ul</code> 的 <code>margin-top: 4px</code>；</li>
                <li>嵌套 <code>ul</code> 的 <code>margin-bottom: 0</code>；</li>
                <li>
                  非末位嵌套块补 <code>padding-bottom: 4px</code>，避免和下一个兄弟挤在一起。
                </li>
              </ul>
            </li>
          </ol>

          <p>
            这套间距规则放在一起，就形成了 Claude 那种"<em>密但不挤</em>"的节奏。
          </p>

          <h2>3. 字体：衬线优先，CJK 自适应</h2>

          <p>
            Claude 用的是它自家定制的 <code>Anthropic Serif</code>，本地没有的话会 fallback
            到 Georgia → 各种 CJK 字体。完整的 fallback 链长这样：
          </p>

          <pre>
            <code>{`font-family:
  "Anthropic Serif",
  Georgia,
  "Arial Hebrew", "Noto Sans Hebrew",
  "Times New Roman", Times,
  "Hiragino Sans", "Yu Gothic", Meiryo,
  "Noto Sans CJK JP",
  "PingFang TC", "Microsoft JhengHei",
  "PingFang SC", "Microsoft YaHei",
  "Apple SD Gothic Neo", "Malgun Gothic",
  serif;`}</code>
          </pre>

          <p>
            注意到没有 —— 它把 <strong>希伯来语</strong>排在 CJK 前面。理论依据是
            希伯来字母在 Georgia 里的渲染质量比较差，要尽早 fallback 到原生字体。
          </p>

          <h2>4. 实测尺寸表</h2>

          <p>下面是我从 DevTools 抓出来的最终数值，已经写进 CSS 里：</p>

          <table>
            <thead>
              <tr>
                <th>元素</th>
                <th>font-size</th>
                <th>line-height</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>正文 <code>p</code></td>
                <td>16px</td>
                <td>1.5（24px）</td>
                <td>容器 gap 12px</td>
              </tr>
              <tr>
                <td><code>h2</code></td>
                <td>22px</td>
                <td>1.2（26.4px）</td>
                <td>weight 600，mt 0</td>
              </tr>
              <tr>
                <td><code>h3</code></td>
                <td>18px</td>
                <td>1.467（26.4px）</td>
                <td>weight 600，mt 12</td>
              </tr>
              <tr>
                <td><code>code</code>（行内）</td>
                <td>0.9em（相对父）</td>
                <td>继承</td>
                <td>暗红 + 半透明灰底</td>
              </tr>
              <tr>
                <td><code>pre</code></td>
                <td>14px</td>
                <td>1.625（22.75px）</td>
                <td>白底半透明 + 0.5px 边</td>
              </tr>
              <tr>
                <td><code>table</code></td>
                <td>14px</td>
                <td>1.7（23.8px）</td>
                <td>表头底边粗于行</td>
              </tr>
            </tbody>
          </table>

          <hr />

          <h2>5. 一些被我"修正"了的小细节</h2>

          <p>
            原始计算样式里有一些显然是工程脚手架副作用的、不该出现在"设计意图"里的值。
            我在还原时偷偷修掉了：
          </p>

          <ul>
            <li>
              <del>li margin-bottom: 8px</del> —— 实际是被 flex gap 覆盖的死代码，删掉；
            </li>
            <li>
              <del>blockquote padding-right: 32px</del> —— 看起来像在留侧栏，但 Claude 的
              对话区根本没侧栏，估计是历史遗留；这里保留了，可能某天它真的要用；
            </li>
            <li>
              <del>table 单元格 padding-left: 1px</del> —— <em>不</em>是我打错字，真的是 1px。
              Claude 故意让数据列贴最左侧，让眼睛能直接顺着列首扫。
            </li>
          </ul>

          <h3>试试看链接和强调</h3>

          <p>
            选一段混合文本来压力测试：这是 <strong>加粗</strong>，这是 <em>斜体</em>，
            这是 <del>划掉的话</del>，这是 <a href="https://www.anthropic.com">外链</a>，
            还有 <strong><em>加粗 + 斜体</em></strong>，以及紧贴的{" "}
            <code>inline_code()</code>。整体节奏应该不打架。
          </p>

          <h4>更深一级的标题（h4）</h4>

          <p>
            到 h4 就基本和正文同号（16px）了，靠的是字重 600 和 8px 的上间距与正文区分。
            再深就没必要了 —— 一个对话回答里出现 h5、h6 几乎是写作味道出了问题。
          </p>

          <h2>结语</h2>

          <p>
            排版这件事的有趣之处在于：你看着像"什么都没做"，但每一个选择背后都有理由。
            如果你也在做 LLM 的对话 UI，建议从 Claude、ChatGPT、Gemini 各扒一份这样的
            CSS 出来对照看 —— 你会发现三家在同一个问题（标题与段落怎么连）上给出的答案
            非常不一样。
          </p>

          <p>
            <em>—— 完 ——</em>
          </p>
        </article>
      </div>
    </div>
  );
}
