# 划选气泡 → 轻量对话 → 分支：交互与技术调研报告

> 调研对象：`app/thread-chat/`（分支对话原型）。两个问题：
> **Q1** 开分支到底创建了什么？气泡里该不该加输入框，还是开了分支再让用户输入？
> **Q2** 「气泡内轻量对话」方向：划选→气泡带输入框→可在气泡里完成对话，也可升格为完整分支列。
>
> 本报告为纯调研产物，未修改仓库任何文件。外部事实均附来源链接；仓库事实均附文件与行号级出处。

---

## 0. 代码现状速览（后文论证的锚点）

| 事实 | 出处 |
|---|---|
| 气泡现状：划选 assistant 文字（document 级 mouseup 监听）→ 定位气泡（`position:fixed`，宽 230px，quote 区 max-height 52px）→ 一个按钮「开启分支讨论」+ 迷你列条（有分支列时，+46px 高） | `branching/selection-bubble.tsx` L74–129、`thread-chat.css` L161–186 |
| **任何滚动都立即关闭气泡**（`document.addEventListener("scroll", onScroll, true)`，capture），mousedown 点气泡外也关 | `selection-bubble.tsx` L115–122 |
| 点按钮：先 `window.getSelection()?.removeAllRanges()` 清选区，再 `onFork(sel, hint)` | `selection-bubble.tsx` L243–252 |
| `store.fork(input)`：创建新 `Thread`（`id="b"+seq`、`parentId`、`depth=父+1`、`anchorText`、`forkFromMsgId`、`footnote` 全局递增）；**在新 Thread 的 `messages` 里预置一条 assistant 消息**（`text = input.introText`，必填）；往来源消息 `srcMsg.forks` push 一条 `Fork{text,num,threadId,depth}` 边（= 原文锚点高亮 + 脚注）；`parent.children.push` | `core/store.ts` L77–115 |
| `introText` 由壳层传入写死文案 `cannedIntro(s.text)`；随后 `cols.openThread(r.threadId, s.threadId, hint)` 放置成列 | `thread-chat-demo.tsx` L135–165、`data.ts` |
| `send(threadId, userText, replyText)`：同步 push 一条 user + 一条 assistant（canned） | `core/store.ts` L118–126 |
| 上下文不复制：渲染/发请求时 `collectInherited` 沿 lineage 现查（P3） | `core/selectors.ts` L25–32 |
| 「打开某会话」统一走 `openBranchUI(id, sourceId, hint?)`（P4）；放置策略纯函数 `place()`/`previewPlacement()` 共用（P7），`PlacementHint{keepSource, targetId}` 两级覆盖（P8） | `thread-chat-demo.tsx` L111–132、`orchestration/placement.ts` |
| ChatView 是插槽化单会话组件（header/banner/intro/renderAssistantBody/renderAfterMessage 全插槽），composer 内嵌，`.msg-list[data-list]` + `.bubble[data-role="assistant"]` 是划选反查的 DOM 契约 | `chat/chat-view.tsx` L32–135 |
| README §11 已把本功能列为未决问题：「气泡内轻量对话……**P1『气泡也是视口』的自然延伸**。涉及 fork 首条消息策略：空分支 / 自动首问 / 用户带问开分支（当前 demo 是『自动引导回复』变体）」 | `app/thread-chat/README.md` §11 |
| 接真实模型路线：fork/send 改异步流式，`Message` 增 `status: pending/streaming/done/error`；`anchorText` 注入 system prompt；锚点定位改 W3C TextQuoteSelector 思路 | README §10.1–10.4 |
| 移动端判断（画布调研）：多列在手机塌到 1–2 列，「画布 + fitView 可能是移动端更优默认视图」；画布内划选因手势冲突初版不支持 | `docs/canvas-mode-research.md` §「移动端判断」「4.3」 |

一句话现状：**点气泡按钮 = 立即创建一个新会话（Thread）+ 一条写死的 assistant「引导回复」+ 原文脚注锚点，然后放置成列**。没有用户消息，没有模型调用。

---

## 1. 模式调研：内联 / 选区锚定对话的既有范式

统一用「**触发 → 锚定 → 驻留 → 升格 / 收起**」四拍拆解。最后汇总「轻交互何时该升格」的信号设计。

### 1.1 VS Code Copilot inline chat（最接近的范式）

- **触发**：`⌘I`（编辑器内），**选中一段代码即把 prompt 的作用域限定在选区**（"Select a block of code in the editor to scope the prompt to that code"）。
- **锚定**：输入条就地出现在编辑器内选区/光标处，不离开代码。
- **驻留**：单任务内可迭代——生成的改动以待定 diff 呈现，用 **Keep / Undo** 接受或回滚；可换措辞重发。是「一个任务多次迭代」，不是开放式多轮聊天。
- **升格**：两条明确的升格路：Quick Chat 有 **"Open in Chat View"** 按钮；当文件属于一个进行中的 chat 编辑会话时，`⌘I` 直接变成 **"Ask in Chat"**——prompt 被路由进 Chat 面板的既有会话以获得完整对话上下文（可用 `inlineChat.askInChat: false` 关掉）。**升格带着 prompt 走，不丢输入**。
- **收起**：Esc 丢弃；Keep 落地。
- 来源：[VS Code 官方文档 · Inline chat](https://code.visualstudio.com/docs/copilot/chat/inline-chat)、[Use chat in VS Code](https://code.visualstudio.com/docs/copilot/chat/copilot-chat)

**要点**：升格的触发信号是「**上下文范围超出了锚定范围**」——inline 作用域=当前编辑器/选区，需要会话级上下文时系统主动把入口换成 "Ask in Chat"。这与我们的「气泡=锚点范围、列=会话范围」精确同构。

### 1.2 Cursor Cmd+K（inline edit + quick question）

- **触发**：`⌘K`，prompt bar 就地出现在选中代码处；有选区=改选区，无选区=就地生成。
- **锚定**：浮条锚定在代码行上。
- **驻留**：生成后可在同一浮条里继续下指令迭代（"这个函数要加错误处理"→Enter）。**quick question 模式**：`Opt/Alt+Enter` 把浮条切成问答——**只回答关于选区的问题、不改代码**，答案就地显示。这是「在浮层里完成一次轻问答」的直接先例。
- **升格**：`⌘L` 打开 Agent/Chat 面板，**选中代码自动作为上下文带过去**。
- **收起**：Esc。
- 来源：[Cursor Docs · Inline edit](https://cursor.com/docs/inline-edit/overview)、[cursor101 教程](https://cursor101.com/tutorial/learn-cursor-cmdk)

**要点**：读（quick question）与写（edit）在同一浮层内用修饰键区分；升格快捷键独立且**带上下文迁移**。对应到我们：气泡内 Enter=轻问答，⌘Enter=升格开列，是有成熟先例的键位语义。

### 1.3 Notion AI 选区工具条

- **触发**：高亮文字 → 浮动工具条 **"Ask AI"**（另有 `/ai`、空格键等入口）。
- **锚定**：下拉菜单锚定在选区下方，生成结果显示在选区下的浮动面板里。
- **驻留**：结果面板内可继续输入 prompt 迭代（preset：改写、翻译、解释…或自定义指令），但**结果是悬浮的临时物**。
- **升格 / 落地**：没有「转正为对话」的路——落地动作是 **Replace / Insert**（写回文档）；不落地就丢弃。
- **收起**：Esc / 点外部 → 结果直接消失（社区长期抱怨点）。
- 来源：[Notion 官方指南 · Notion AI for docs](https://www.notion.com/help/guides/notion-ai-for-docs)、[Everything you can do with Notion AI](https://www.notion.com/help/guides/everything-you-can-do-with-notion-ai)

**要点（反面教材）**：轻交互产物**没有持久身份**导致「收起即丢」，用户被迫在「立即决定落地」的压力下工作。我们的方案必须避免——这直接支持 §3 的「输入即 fork、脚注立即落原文」路线。

### 1.4 Google Docs Gemini「Help me write」

- **触发**：选中文字 → 浮动条点 **"Refine"**（空行则是 "Help me write" 提示）。
- **锚定**：浮动条与建议面板锚定在选区旁。
- **驻留**：预设动作（Rephrase / Shorten / Elaborate / More formal…）+ 建议以 diff 形式呈现，**Accept suggestion / Accept all / Reject all** 逐条或整体落地。
- **收起 / 徽标化**：浮动条**会自动最小化为一个 Gemini 小徽标**以免遮挡，hover 徽标即恢复（"automatically minimizes to clear your screen"）。
- **升格**：开放式对话去右侧 Gemini 侧栏（独立入口，浮动流不直接升格）。
- 来源：[Google Docs 帮助 · Write & edit with Gemini](https://support.google.com/docs/answer/13951448?hl=en)、[Collaborate with Gemini in Google Docs](https://support.google.com/docs/answer/14206696?hl=en)

**要点**：「**浮层折叠成贴边徽标、hover/点击恢复**」是解决「浮层遮挡正文 + 滚动后何去何从」的现成答案，正好回答我们「气泡驻留策略」的问题（§3.2）。

### 1.5 Arc：Peek 与 Little Arc（peek → commit 心智）

- **触发**：Peek——从 Pinned/Favorite Tab 点链接自动以 Peek 预览打开；Little Arc——外部 app 点链接弹出的独立小窗。
- **锚定**：Peek 是当前页之上的居中浮层窗口；Little Arc 是独立浮窗。
- **驻留**：浮层里是**完整可交互的真实页面**（不是缩略图），但身份是临时的。
- **升格**：Peek → 展开按钮 / `⌘O` 转为正式 Tab，或转 Split View；Little Arc → `⌘⇧O` 提升进主窗口 / "Open In" 按钮收进 Space。**升格 = 换容器不换内容**（页面状态原样保留，不重载）。
- **收起**：关掉即走，不留痕迹。
- 来源：[Arc Help · Peek](https://resources.arc.net/hc/en-us/articles/19335302900887-Peek-Preview-Sites-From-Pinned-Tabs)、[Arc Help · Little Arc](https://resources.arc.net/hc/en-us/articles/19235387524503-Little-Arc-Quick-Lookups-Instant-Triaging)

**要点**：peek→commit 的核心承诺是「**先用后决定，转正零损耗**」。用户敢在轻容器里投入（真的去读、去交互），是因为知道随时能无损转正。我们的气泡→列升格必须给出同样的承诺：**气泡里聊的每一句，升格后一字不少地在列里**——这只有「气泡对话本来就在树里」（§3.1 路线一）才能结构性保证。

### 1.6 macOS 词典弹窗（Look Up）

- **触发**：force click / 三指轻点 / `⌃⌘D` / 右键 "Look Up"。
- **锚定**：带箭头的 popover 直接钉在那个词上。
- **驻留**：纯只读卡片，可横滑切换词典/Siri 知识/影片等面板；零输入。
- **升格**：卡片底部 **"Open in Dictionary"** 打开完整词典 app。
- **收起**：点外部/Esc，无痕。
- 来源：[Apple 支持 · Look up words on Mac](https://support.apple.com/guide/mac-help/mchl3983326c/mac)

**要点**：即使是最轻、零输入的查询式浮层，也**永远保留一扇通往完整形态的门**。「查一下」不值得开 app，但门必须在。我们的气泡即便只答一轮，也要常驻升格入口。

### 1.7 Medium 高亮 / Hypothesis 边注

- **Medium**：选中文字 → 工具条（高亮 / Respond / 私密笔记 / 分享）。高亮**立即持久落在原文上**（作者与关注者可见）；"Respond" 把高亮引用进一篇新的 response——**锚点先落地、讨论后展开**。私密笔记：选区 → 锁形图标 → 边注，作者可见可回复。
- **Hypothesis**：选中文字 → 弹出 Annotate/Highlight 二选一 → 边注编辑在**固定侧栏**展开；高亮永久留在页面，点高亮 → 侧栏定位到对应边注；**边注支持 threaded replies**（锚定在选区上的多轮讨论已是既有形态）。底层是 W3C Web Annotation 标准（`TextQuoteSelector` 等选区锚定模型——README §10.4 已计划采用同一思路做锚点鲁棒定位）。
- 来源：[Medium Help · About highlights](https://help.medium.com/hc/en-us/articles/214406358-About-highlights)、[Medium Help · Responses & notes](https://help.medium.com/hc/en-us/sections/115001496348-Responses-notes)、[Hypothesis · Annotation Basics](https://web.hypothes.is/help/annotation-basics/)、[W3C Web Annotation 成为标准](https://wptavern.com/web-annotations-are-now-a-w3c-standard-paving-the-way-for-decentralized-annotation-infrastructure)

**要点**：注释类产品的共同选择是「**划选痕迹立即入库，内容可以后补**」——高亮本身就是一等公民数据。映射到我们：`store.fork` 本来就在划选确认那刻把 `Fork` 边写进原文消息（`srcMsg.forks.push`），气泡轻对话应当延续这个「锚先落地」语义，而不是造一个「不落地的临时对话」。Hypothesis 的 threaded replies 则证明「锚定于选区的多轮对话」不是新发明。

### 1.8 Perplexity follow-up（对照组：quote-into-composer）

- **触发**：划选回答中的文字 → 选区菜单出现两个动作：**加入 follow-up 追问 / 核查该段来源**。
- **锚定**：选中文字被**引用进页面底部的追问输入框**——不是在选区旁开浮层。
- **驻留 / 升格**：无升格概念——追问直接追加在**同一条线性会话**末尾。
- ChatGPT 同款：选中回复文字 → 出现引号「Reply」按钮 → 引文进输入框再追问。
- 来源：[AI UX Playground · Perplexity output teardown](https://aiuxplayground.com/teardowns/perplexity/output/)、[Perplexity Help · How does Perplexity work](https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work)、[ChatGPT "Reply" 功能演示](https://x.com/ai_for_success/status/1786306348881190962)、[Exploring ChatGPT's Quote Feature](https://www.autoage.it/en/exploring-chatgpt-s-quote-feature)

**要点（差异化定位）**：主流 AI 产品已把「选区→追问」做成标配，证明**需求真实且高频**；但 quote-into-composer 把追问全部灌回主线——正是 README §1 描述的「几个追问堆进同一条线，最后理不清」的病根。Thread Chat 的分支是结构性解法；**气泡轻对话是这两极之间缺失的中间形态**：比 quote-into-composer 干净（不污染主线），比开列轻（不打断阅读）。

### 1.9 汇总：「轻交互何时该升格」的信号设计

| 信号 | 定义 | 先例 | 映射到气泡方案 |
|---|---|---|---|
| **范围信号** | 问题超出锚定范围（选区/单文件 → 会话/工程） | VS Code "Ask in Chat" | 用户追问开始引用别的分支/上传文件 → 建议升格 |
| **轮次信号** | 轻容器按 1–2 轮设计，超过即换容器 | Cursor quick question 单问；Notion 落地即终 | 气泡容量 2 轮，第 3 次提交自动升格（§3.2） |
| **空间信号** | 产物体积超出容器（长回复/代码块/artifact） | Arc Peek→Tab；词典→Dictionary app | 回复含 artifact/超长 → 升格提示前置 |
| **落地信号** | 产物需要持久身份 | Notion Insert；Little Arc "Open In" | 我们用「输入即 fork」把落地成本降为零，落地信号消失——这是相对所有先例的简化 |
| **意图信号** | 升格永远由用户显式动作触发，绝不自动弹全量界面 | 全部先例一致 | 升格=点按钮/⌘Enter/第 3 次提交，符合 P6（不打断思考流）与 P8（默认零成本） |
| **无损承诺** | 升格换容器不换内容 | Arc（页面不重载）、VS Code（prompt 带走）、Cursor ⌘L（选区带走） | 气泡对话在树里 → 升格=`openBranchUI` 换视口，天然无损（§3.1） |

---

## 2. Q1：fork 的首条消息策略

### 2.1 先回答字面问题：「打开新分支会创建一条新消息还是新聊天？」

**创建的是一个新会话（新聊天），不是一条消息**——但这个新会话当前出生时自带一条消息。按 `core/store.ts` 的 `fork()`（L77–115），点击气泡按钮那一刻发生三件事：

1. **新 `Thread` 入树**：`state.threads["b"+seq] = { parentId: 来源会话, depth: 父+1, anchorText: 划选文字, forkFromMsgId: 来源消息, footnote: 全局递增号, … }`，并 `parent.children.push(id)`。
2. **原文落锚**：来源消息 `srcMsg.forks.push({ text, num, threadId, depth })`——这就是正文里的锚点高亮和脚注上标（`branchable-chat.tsx` 的 `computeRanges` 据此渲染），点它可随时重开该分支。
3. **预置一条 assistant 消息**：新 Thread 的 `messages = [intro]`，`intro.text = input.introText` = 壳层传入的 `cannedIntro(s.text)` 写死文案（`thread-chat-demo.tsx` L141）。**没有 user 消息、没有模型调用**。

上下文方面：分支**不复制**父线消息——渲染「继承的上文」和（未来）发模型请求时用 `collectInherited()` 沿 lineage 现查（P3），所以「新聊天」的成本只是一个小对象，继承是逻辑事实不是数据拷贝。

### 2.2 四个选项对比（真实模型语境）

| | **A 空分支**（用户去新列首问） | **B 自动首问**（系统代拟「展开讲讲『锚点』」发给模型） | **C 气泡带输入框**（用户带问开分支） | **D 现状**（写死引导回复） |
|---|---|---|---|---|
| 心流成本（P6） | **差**。划选已表达一次意图，到新列还要从零组织问题；批量开分支时每个都欠一次输入 | **最好**。零输入即产出，与现 demo 体感一致 | **中上**。就地输入、视线不离锚点；若输入**可选**，决策成本趋近零 | （demo 专用）零输入 |
| token 成本 | 零（未问不花） | 每次 fork 一次调用 + 全量继承上下文；**误开也花钱**；深树继承段长（README §10.2 上下文腐烂提醒） | 与 B 相同的一次调用，但问题=真实意图，**同样的 token 买到更高命中** | 零（无调用） |
| 空态问题 | **最差**：新列只有 focus banner + composer；死分支会积累在 ⌘K/画布里 | 无：首答即内容，标题可从首答生成（§10.5） | 无 | 无（但内容是假的） |
| 失败模式 | 无模型失败，但有「开而不问」的用户失败 | **代拟角度错位**：用户划「向量检索」可能想问「它和图记忆怎么选」，而系统只会「展开讲讲」；答非所问时已花一次等待+token，还要再纠正一轮 | 最小：失败只剩模型能力问题 | 真实模型下**不可实现**：无 user 消息的首条 assistant 在对话协议里没有位置，内容也无法预生成 |

补充两条工程事实：
- **B 的代拟首问必须渲染为可见的 user 消息**，不能藏进 system prompt——否则分支第一条是 assistant 凭空开口，`collectInherited` 之后的消息序列也失去 user/assistant 交替结构。
- **D 是 B 的演示版**（README §11 原话「当前 demo 是『自动引导回复』变体」）：接模型时 `introText` 参数应整体退役，换成「首条 user 消息 + 异步流式首答」。

### 2.3 推荐：默认 B + 可选 C，合并成一个控件

**气泡带一个可选输入框**（这也正是 Q2 的第一块台阶）：

- 输入框占位符：「就这段问点什么…（留空则自动展开）」。
- **留空提交** → 走 B：代拟首问（如「展开讲讲『{anchorText}』」）作为**可见 user 消息**入分支，随即流式首答。保住 P6 的零输入心流。
- **输入后提交** → 走 C：用户问题作为分支首条 user 消息。答非所问率最低。
- 两条路径的数据形状**完全一致**（首条=user，第二条=流式 assistant），下游（标题生成、collectInherited、画布摘要）无需分支处理。
- **A 不做默认**，但 core 的 `fork` 应支持「无首条消息」创建——这是 Q2 气泡轻对话的前置能力（先 fork 后陆续 send），也给未来「先开分支后提问」的场景留口。

这个组合与 P8「默认零成本，控制分层递进」同构：默认（留空=B）→ 可选（带问=C）→ 事后（分支里继续追问纠正）。与 VS Code（选区即上下文、prompt 可选细化）和 Cursor（⌘K 空提交=生成、带指令=定向）的分层完全一致。

---

## 3. Q2：气泡内轻量对话——方案设计

### 3.1 数据模型归属（关键决策）：气泡对话是不是一个 thread？

**是。推荐「气泡 = 同一棵树的第三种视口」**（列、画布节点之外）：用户在气泡里**首次提交输入的那一刻**就 `store.fork()`（无 intro、带首问），此后气泡只是渲染这个新 thread 的迷你视口；脚注立即落原文（fork 本来就 push `srcMsg.forks`）；**升格 = `openBranchUI(threadId, sourceId, hint)` 换视口，不换数据**。

这不是新原则，是 P1 的原文兑现——README P1 落点栏写的就是：「列、画布节点、**（未来的）气泡**都是同一棵树的不同视口」；§11 也已把本功能定性为「P1『气泡也是视口』的自然延伸」。

两条路线的代价表：

| 维度 | **路线一：入树视口**（输入即 fork） | **路线二：临时 scratch**（不入树，升格才转正） |
|---|---|---|
| 脚注 / 锚点 | fork 即落原文；Esc 收起后**点脚注可重开**——「收起不丢」免费获得 | 收起即丢；要「不丢」得再造一套 scratch 持久化，等于重新发明 thread |
| ⌘K / 画布 / 子树可见性 | 自动可见（`allTreeRows` 遍历 `state.threads`），只差一个「轻分支」标注 | 不可见；转正瞬间才在画布里凭空冒出并触发重排，体验突兀 |
| 丢弃语义 | 「反悔」需要新增 `store.removeThread`（清 threads、parent.children、srcMsg.forks）——**此路线唯一的新增成本** | 天然免费（组件卸载即丢） |
| 实现复杂度 | 复用 `fork/send/collectInherited`、`Message.status` 流式、现有渲染件；**无平行状态机** | 平行的消息数组 + 流式态 + 错误态 + 转正时回放迁移；两套代码路径两套 bug |
| 与 P1/P3 一致性 | 完全一致；上下文照常沿 lineage 查询 | **违背 P1**（组件拥有了会话）；scratch 的上下文要么复制（违 P3）要么重复实现查询 |
| 升格的无损承诺（§1.9） | 结构性保证：数据从未离开树 | 依赖迁移代码正确性 |
| 撤销 / toast | 与现有 `PlaceEffect`+undo 体系同构 | 另做 |

裁决理由再加两条：
- **「聊了一轮就收起」在这个产品里不是垃圾**。Thread Chat 的定位是「可导航的思考树」，一次浅问答就是一个合法的浅分支——留在树里（画布可见、⌘K 可搜、脚注可回）恰恰是产品价值，不是污染。真正的删除做成显式动作即可（可后置）。
- **移动端主形态不能建在临时态上**（见 §3.2 移动端小节）：如果轻视口将来是移动端的主要对话形态，它必须是一等公民数据。

一个关键微调消化「树污染」担忧：**fork 时机 = 首次提交输入，而非气泡弹出**。「划选了但没提问」阶段维持现状（纯 UI 临时态，滚动即散）；提问才入树。这样树里**结构性不存在零消息分支**，Q1 里选项 A 的「死分支」问题也顺带消失。

### 3.2 交互细节

**驻留策略（现状 scroll 即隐藏，轻对话需要什么）**——按状态分层：

- **未提问态**（= 现气泡 + 输入框）：维持现行为。滚动即关（`selection-bubble.tsx` L118 的 capture 监听）、点外即关——此时无任何用户投入，关闭零成本。
- **对话态**（首问提交后）：
  - **锚定跟随**：选区 Range 在提交时已被清掉（L249 `removeAllRanges`，且流式重渲也会使 rect 失效），但 fork 已把锚点写成原文里的 `.anchored` span（`branchable-chat.tsx` 渲染）——**改用该 span 的 `getBoundingClientRect()` 作为锚定源**，滚动/列宽拖拽/resize 时 rAF 重算气泡位置。
  - **滚出视口 → 折叠成徽标**：锚点 span 离开视口时，气泡折叠为贴视口边缘的小徽标（脚注号 + 深度色 + 首字标题），点击展开回气泡；锚点回到视口则跟随恢复。先例即 Google Docs Gemini 浮条的「自动最小化成徽标、hover 恢复」（§1.4）。
  - **不建议固定悬浮**：丢失「这是关于那段话的」锚定感，且与 Artifact 抽屉、toast 抢屏幕角落。
- 页面 mousedown 在对话态不再关闭——改为「点外部 = 收起成徽标」。

**多轮上限与升格引导**：

- 气泡容量 **2 轮问答**。第 2 轮回答完成后 composer 上方出现一行提示：「继续深入？展开为分支列（⌘⏎）」；**第 3 次提交输入时自动升格**，该输入作为第 3 问直接在列里发出（无损、不打断）。
- 依据：§1.9 轮次信号——所有轻容器先例都是 1–2 轮设计；物理上气泡宽 ~320px、高 ~420px 也只装得下 2 轮。
- 空间信号优先于轮次信号：回复**产出 artifact**（本就要弹右侧抽屉）或超长/含代码块时，第 1 轮就前置升格建议。

**Esc / 点外部 = 收起不丢**：

- thread 已在树里、脚注已在原文——收起只销毁视口（P1 原话：「收起一列销毁的是视图，会话仍在树里」，气泡同理）。
- 重开路径：点原文脚注/锚点高亮。Phase B 简单版：点脚注仍走现有 `openBranchUI` 开列（行为不变，不惊扰 verify2 契约）;完整版：**轻分支（消息数 ≤ 4 且不在列槽）点脚注默认重开气泡，⌘点开列**——与现有「⌘=更重的动作」键位语义一致。

**流式回复在气泡里的形态与尺寸**：

- 回复区 max-height ≈ 240px、`overflow-y: auto`、流式期间自动跟底；`Message.status`（README §10.1 的 `pending/streaming/done/error`）直接驱动打字机/骨架/重试按钮，**与列里同一套状态、同一条 store 通知管道**（version 快照订阅天然支持高频 chunk，必要时 rAF 节流 notify——§10.1 原文）。
- 宽度：未提问态维持 230px；对话态扩到 ~320px。仍显著窄于列（列 min 340px、自适应基准 `COL_MIN_W=430`、阅读通道 `--lane-max` 760px）——尺寸差本身就是「轻 vs 全量」的视觉语义。
- 气泡内 assistant 文字**禁止再划选开分支**（不挂 `.bubble[data-role="assistant"]` 或加拦截标记）：气泡里套气泡在 320px 里没有生存空间；想再分叉=先升格。

**升格路径与放置控制的衔接**：

- 升格 = `openBranchUI(bubbleThreadId, sel.threadId, hint)`——**零新增编排代码**（P4 统一意图的直接受益）。列满替换/折叠、toast 撤销、flash 全部继承。
- 对话态气泡保留**迷你列条**（slotmap）：升格前就能预览「将替换/将折叠哪列」并点选让位列——`previewPlacement` 哨兵机制原样适用（P7 预览不撒谎）；⌘ 跟踪（`metaHeld`）语义不变。
- 未提问态的列条可收敛为一行小字「将开在第 N 列」（hover 展开完整列条），缓解输入框加入后的密度问题（见风险）。

**键盘流**：

| 按键 | 未提问态 | 对话态 |
|---|---|---|
| Enter | 带问开轻对话（fork + 首问）；**留空 = B 自动首问直接开列**（轻对话必须带具体问题，保持「轻 = 有明确问题」语义） | 气泡内追问（send） |
| Shift+Enter | 换行 | 换行 |
| ⌘Enter | 带问直接升格开列（跳过气泡态） | 升格开列，当前输入带过去 |
| ⌘（按住） | 现有 keepSource 跟踪不变（按钮文案实时切换） | 同左，作用于升格目标 |
| Esc | 关气泡（现有 Esc 链第一层，`thread-chat-demo.tsx` L216–220 顺序不动） | 收起成徽标（Esc 链插入此层：徽标态 → 气泡态 → 切换器 → 抽屉） |

**移动端判断**：

- 画布调研已下结论：手机上多列塌到 1–2 列、「画布 + fitView 可能是移动端更优默认视图」（`canvas-mode-research.md`）。补上对话层的缺口：**轻视口很可能就是移动端的主对话形态**——桌面渲染成锚定气泡，移动端渲染成 **bottom sheet**（半屏，可下滑收起、上滑拉满），升格 = sheet 拉满为全屏单列（移动端没有「列」可开）。
- 移动端触发不走划选（长按选区菜单与系统冲突），走**点脚注/锚点高亮唤起 sheet**，或画布节点单击唤起 sheet（画布 Phase 2 的「节点内继续对话」与此共用同一轻视口）。
- 这条路线反向锁定 §3.1 的裁决：轻视口若是移动端主形态，其内容必须是一等公民数据（入树），不能是 scratch。

### 3.3 与四层架构的映射

- **chat 层（插槽体系的检验结果：部分复用）**：`ChatView` 不能整件塞进气泡——它绑定了 header/banner/composer 的列式布局，且 `.msg-list[data-list]` + `.bubble[data-role="assistant"]` 会让气泡内容再次命中划选监听（气泡套气泡）。检验结论：插槽体系缺一块「消息列表本体」的可复用件。两步走：Phase B 先给气泡写**独立紧凑渲染**（无 who 标签、小字号、~40 行），形态稳定后再从 `chat-view.tsx` 抽出 `MessageList` 子组件供列与气泡共用（接口不破坏，`renderAssistantBody`/`renderAfterMessage` 插槽照传）。避免过早抽象。
- **core 层（最小改动）**：
  1. `ForkInput.introText` 退役，改为 `firstQuestion?: string`——**fork 允许无 intro**：无参时 `messages: []`（供气泡「先 fork 后 send」），有参时 `messages: [user(firstQuestion)]` 并触发异步首答。
  2. `send` 按 README §10.1 拆异步：push user + pending assistant → 流式追加 text → `notify()`。**气泡与列共用同一 send**——P1 的直接后果：视口不同，数据操作同一套，core 不知道也不需要知道调用方是谁。
  3. （可后置）`removeThread(id)`：显式删除轻分支的反悔动作。
  4. **Thread 不加「气泡态」字段**——P10（视图状态不进领域模型）：一个 thread 此刻显示在气泡还是列，是视口事实，由壳层 state 持有（`bubbleThread: { threadId, anchorMsgId } | null`），与画布 pin 表同一模式（`thread-chat-demo.tsx` L88 的长寿宿主对象先例）。
- **branching 层（改动面最大，但内聚）**：`selection-bubble.tsx` 从「按钮气泡」演化为「轻视口」：保留划选监听、⌘ 跟踪、slotmap、定位夹取；新增输入框（Phase A）与对话态（Phase B，建议拆新文件 `branching/bubble-thread.tsx`，让 selection-bubble 保持「未提问态」职责单一）。开合状态仍由上层持有（现有 `sel/onSelChange` 模式扩展），Esc 链在壳层统一调度不变。
- **orchestration 层（零必改，两处可选增强）**：升格走 `openBranchUI` 老路，placement/columns/canvas 一行不动。可选：`thread-switcher.tsx` 行内给轻分支加「· 轻」徽章（判据由壳层传入或按 `messages.length≤4 且不在 slots` 派生）；`canvas-node.tsx` 对轻分支渲染小号卡片。slotmap 无需显示气泡态会话——它不占列槽，只在升格预览时以哨兵参与。

### 3.4 风险清单

| 风险 | 具体点 | 对策 |
|---|---|---|
| 气泡内滚动 vs 页面滚动 | 现 scroll 监听是 **capture:true**（L121），气泡内部的滚动事件也会冒进它导致误关；触控板惯性滚动高频触发 | 对话态：事件 target 在 `.sel-bubble` 内则忽略；页面滚动改「rAF 节流跟随 + 出视口折叠徽标」而非关闭 |
| 选区 rect 失效 | 提交即 `removeAllRanges()`（L249）；流式重渲、列宽拖拽（rAF 直写 DOM）、窗口 resize 都会使一次性 rect 过期 | fork 落地后立即改锚 `.anchored` span（活元素，随排版走）；span 依赖 `computeRanges` 的 indexOf 定位——README §10.4 的 TextQuoteSelector 改造同时加固此处 |
| 气泡遮挡正文 | 对话态 320×~420px 会盖住相邻列正文 | 优先选区右下开、空间不足翻转（现有夹取逻辑 L109–111 扩展）；对话态给拖拽把手（位置=视图状态，不入 core）；徽标折叠是最终兜底 |
| a11y / 焦点管理 | 非模态浮层的焦点去向；流式内容播报；键盘可达 | 弹出即 focus 输入框；Tab 圈定气泡内（Esc 可出）；关闭/升格后焦点归还锚点 span（临时 tabIndex=-1）或目标列 composer；回复区 `aria-live="polite"`；徽标 `aria-label` 带脚注号+标题；延续 smcell 已有的 `role="button"`+键盘激活写法 |
| 与迷你列条共存的密度 | 未提问态 = quote + 输入框 + slotmap + 按钮四层，230px 宽爆炸 | 未提问态 slotmap 收敛为一行文字预览（hover/focus 展开）；对话态才展示完整列条（那时升格预览价值最大）；quote 区在对话态可折叠为一行（焦点横幅在升格后的列里有完整版） |
| 树污染担忧 | 大量一轮即弃的浅分支涌入 ⌘K/画布 | fork 推迟到首次提交（结构性无空分支）；轻分支标识 + ⌘K 排序降权；后置 `removeThread` 反悔动作 |

---

## 4. MVP 拆解

### Phase A：气泡带输入框（= Q1 推荐组合「默认 B + 可选 C」，最小改动）

| 文件 | 改动 | 规模 |
|---|---|---|
| `branching/selection-bubble.tsx` | 气泡加单行 textarea + 键盘流（Enter/⌘Enter/Shift+Enter/Esc）+ 按钮文案随输入切换（「开启分支讨论」↔「带着问题开分支」）；slotmap 密度收敛（可选） | ~70 行 |
| `thread-chat-demo.tsx` | `handleFork(s, hint, question?)` 透传首问 | ~15 行 |
| `core/store.ts` | `ForkInput` 增 `firstQuestion?: string`：有问 → `messages=[user(firstQuestion), assistant(canned 回复)]`（demo 期仍 canned，命中 `CANNED` 话题则用之）；无问 → 现 introText 路径不动 | ~25 行 |

合计 3 文件、~120–180 行净增。**不动** placement / thread-columns / canvas / chat-view，types.ts 不动。demo 期 D（写死 intro）保留为「留空提交」的占位，接模型时随 §10.3 一起退役。

**验收**（新建 `e2e/thread-chat/verify6.js`，纯 Node + playwright-core、`assert(name, cond, detail)` 风格，复用 verify2 的 `selectText` 辅助；**verify2–5 一行不改**——回归契约）：
- 划选 → 气泡含输入框；输入问题 + Enter → 新列第 1 条为该 user 消息、第 2 条为 assistant；脚注/锚点照常落原文；
- 留空点按钮 → 现行为不变（verify2 全绿即为证）；
- ⌘Enter 带问 + keepSource：插入位置与按钮文案断言（对齐 verify5 写法）；
- 输入中 Esc → 气泡关、无消息入树；全程 console error 为零。

### Phase B：气泡内多轮轻对话 + 升格

前置/同期：README §10.1 的异步流式改造（`Message.status`）——Phase B 的 UI 可先用 canned 走通，但真实价值依赖流式。

| 文件 | 改动 | 规模 |
|---|---|---|
| `branching/bubble-thread.tsx`（新） | 对话态轻视口：紧凑消息渲染、composer、轮次计数 + 升格提示行、锚定跟随（`.anchored` span + rAF）、徽标折叠态 | ~200 行 |
| `branching/selection-bubble.tsx` | 首问提交改为上抛 `onStartBubbleThread(sel, question)`，未提问态职责不变 | ~40 行 |
| `thread-chat-demo.tsx` | `bubbleThread` 状态（threadId + 锚定信息）、无 intro fork 调用、升格 handler（`openBranchUI` + 关气泡 + flash）、Esc 链插「收起成徽标」层 | ~60 行 |
| `core/store.ts` | fork 无首条消息路径；send 拆 user/assistant 两步（若流式改造未同期，则保持同步 canned 但拆接口） | ~40 行 |
| `thread-chat.css` | 对话态尺寸、消息区滚动、徽标、流式态 | ~80 行 |
| `orchestration/thread-switcher.tsx` / `canvas-node.tsx`（可选） | 轻分支「· 轻」标识 / 小号卡片 | ~20 行 |

合计 1 新文件 + 4–5 处修改，~400–500 行。

**验收**（`verify7.js`）：
- 气泡内两轮问答 → 消息正确入树（⌘K 可搜、画布节点出现且计数正确）；
- 第 3 次提交自动升格：列里消息连续无缺失（无损承诺）；升格走 placement（列满时替换预览=提交行为，沿用 verify5 断言法）；
- Esc 收起成徽标 → 点徽标恢复，消息仍在；点脚注路径行为断言；
- 气泡内部滚动不关闭气泡；页面滚动锚点出视口 → 徽标出现；
- 焦点断言：弹出聚焦输入框、关闭归还锚点；console error 为零。

---

## 5. 结论

**Q1**：现在点气泡按钮创建的是**一个新会话（`Thread`）**——自带原文脚注锚点（`srcMsg.forks`）和一条**写死的 assistant 引导回复**（`fork()` 预置的 `introText`），没有用户消息、没有模型调用；上下文靠 `collectInherited` 查询继承而非复制。接真实模型时，「写死引导」应升级为**「默认自动首问 B + 可选带问 C」合并在一个可选输入框里**：留空提交 = 系统代拟「展开讲讲『锚点』」作为可见 user 消息（保住 P6 零输入心流），输入了 = 用户问题直接作首条 user 消息（同样的 token 买到最低的答非所问率）;不推荐空分支 A（空态差、积累死分支），D 在真实对话协议下本就无法保留。**Q2**：气泡轻对话应做成**同一棵树的第三种视口**（P1 原文已把气泡列为视口）——首次提交输入即 `fork`（无 intro）、脚注立即落原文、气泡内追问复用同一 `send`、升格 = `openBranchUI` 换视口不换数据（编排层零改动，placement 预览/⌘/列条全部继承），收起 = 销毁视图不销毁会话（徽标/脚注可重开）;不做不入树的 scratch——那会造出平行状态机、违背 P1/P3，且升格无损承诺（Arc peek→commit 的核心）只有入树才能结构性保证。**第一步：做 Phase A（气泡带输入框）**——3 个文件约 150 行、不动任何编排层与回归套件（verify2–5），它同时兑现 Q1 的推荐策略，又恰好是 Q2 对话态的第一块台阶。

---

### 附：外部来源汇总

- VS Code Inline chat：https://code.visualstudio.com/docs/copilot/chat/inline-chat ；Chat view：https://code.visualstudio.com/docs/copilot/chat/copilot-chat
- Cursor Inline edit（⌘K / quick question / ⌘L）：https://cursor.com/docs/inline-edit/overview ；补充教程：https://cursor101.com/tutorial/learn-cursor-cmdk
- Notion AI（选区 Ask AI）：https://www.notion.com/help/guides/notion-ai-for-docs ；https://www.notion.com/help/guides/everything-you-can-do-with-notion-ai
- Google Docs Gemini（Refine 浮条 / 徽标最小化）：https://support.google.com/docs/answer/13951448 ；https://support.google.com/docs/answer/14206696
- Arc Peek：https://resources.arc.net/hc/en-us/articles/19335302900887-Peek-Preview-Sites-From-Pinned-Tabs ；Little Arc：https://resources.arc.net/hc/en-us/articles/19235387524503-Little-Arc-Quick-Lookups-Instant-Triaging
- macOS Look Up：https://support.apple.com/guide/mac-help/mchl3983326c/mac
- Medium 高亮/私密笔记：https://help.medium.com/hc/en-us/articles/214406358-About-highlights ；https://help.medium.com/hc/en-us/sections/115001496348-Responses-notes
- Hypothesis 边注：https://web.hypothes.is/help/annotation-basics/ ；W3C Web Annotation 标准：https://wptavern.com/web-annotations-are-now-a-w3c-standard-paving-the-way-for-decentralized-annotation-infrastructure
- Perplexity 选区追问 teardown：https://aiuxplayground.com/teardowns/perplexity/output/ ；官方 follow-up 说明：https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work
- ChatGPT「Reply」引用回复：https://x.com/ai_for_success/status/1786306348881190962 ；https://www.autoage.it/en/exploring-chatgpt-s-quote-feature
