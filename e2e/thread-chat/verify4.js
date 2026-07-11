/* Thread Chat demo 端到端验证 v4：无限画布模式 Phase 1（只读画布）。
   覆盖：
   · 初始列模式：React Flow 懒加载未触发（无 .react-flow）；
   · 切画布：节点数==会话数、Controls/MiniMap/Background 存在、列数/列满 seg 隐藏、fitView；
   · 回列开 2 分支再切画布：节点 3 / 边 2 / edge label 脚注号正确；单击选中高亮；
   · 双击「向量检索」节点：回列模式且该会话在某列可见；
   · 拖节点 ~(+120,+80)：flow 坐标位移（pin）；回列开第 3 分支再切画布：新节点出现、
     被拖节点位置不变（pin 跨模式切换存活）、未 pin 节点（主线）被 dagre 重排；
   · 「重新排列」：pin 清除、被 pin 节点回 dagre 槽位、fitView 生效（viewport transform 变化）；
   · ⌘K 在画布模式选分支：自动切回列模式且该会话打开；全程无 console error。

   写法参照 react-flow skill 的 e2e-testing reference：
   · 拖拽必须分步 mouse.move（单步不触发 React Flow 拖拽处理）；
   · viewport transform 用 DOMMatrix 读，不手工解析字符串；
   · 节点 flow 坐标读 wrapper 的 inline transform（与 viewport 缩放无关），
     跨「重挂 + fitView」比较位置只能用 flow 坐标（屏幕坐标会随视口变换失真）。 */
const { chromium } = require("playwright-core");
const DIR = __dirname;

let passCount = 0;
let failCount = 0;
function assert(name, cond, detail = "") {
  const line = `${cond ? "PASS" : "FAIL"}: ${name}${detail ? ` (${detail})` : ""}`;
  console.log(line);
  if (cond) passCount++;
  else failCount++;
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const fmt = (p) => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`;

/* —— 复用 verify2 的划选开分支辅助 —— */
const selectAndFork = async (page, needle) => {
  const ok = await page.evaluate((needle) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      const i = (n.textContent || "").indexOf(needle);
      if (i >= 0 && n.parentElement && n.parentElement.closest('.bubble[data-role="assistant"]')) {
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + needle.length);
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
        document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        return true;
      }
    }
    return false;
  }, needle);
  if (!ok) throw new Error("text not found: " + needle);
  await page.waitForSelector(".sel-bubble", { timeout: 3000 });
  await page.click(".sel-bubble button");
  await page.waitForTimeout(500);
};

/* 顶栏「视图」seg 切换：列 | 画布 */
const switchView = async (page, label) => {
  await page.locator(".topbar .seg button.mode", { hasText: label }).click();
  await page.waitForTimeout(250);
};
const enterCanvas = async (page) => {
  await switchView(page, "画布");
  await page.waitForSelector(".react-flow__node", { timeout: 10000 });
  await page.waitForTimeout(500); // 节点测量 + fitView 落定
};

/* viewport transform（skill e2e-testing 的 DOMMatrix 模式） */
const getTransform = (page) =>
  page.$eval(".react-flow__viewport", (el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return { x: m.m41, y: m.m42, scale: m.a };
  });

/* 节点的 flow 坐标（wrapper inline transform；与 viewport 平移缩放无关） */
const nodeFlowPos = (page, title) =>
  page.$eval(`.react-flow__node:has-text("${title}")`, (el) => {
    const m = new DOMMatrix(el.style.transform);
    return { x: m.m41, y: m.m42 };
  });

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("http://localhost:3000/thread-chat", { waitUntil: "networkidle" });

  /* ---- 1) 初始列模式：画布懒加载未触发 ---- */
  assert("初始列模式：无 .react-flow 元素（懒加载未触发）", (await page.locator(".react-flow").count()) === 0);
  assert("初始列模式：顶栏 3 个 seg（视图 / 列数 / 列满）", (await page.locator(".topbar .seg").count()) === 3);

  /* ---- 2) 切画布：1 节点 + 内置组件 + 列模式专属 seg 隐藏 ---- */
  await enterCanvas(page);
  assert("画布：.react-flow__node 数 == 会话数 == 1", (await page.locator(".react-flow__node").count()) === 1);
  assert("画布：初始无边", (await page.locator(".react-flow__edge").count()) === 0);
  assert("画布：Controls 存在", (await page.locator(".react-flow__controls").count()) === 1);
  assert("画布：MiniMap 存在", (await page.locator(".react-flow__minimap").count()) === 1);
  assert("画布：Background 存在", (await page.locator(".react-flow__background").count()) === 1);
  assert("画布：「列数 / 列满」seg 隐藏（仅剩视图 seg）", (await page.locator(".topbar .seg").count()) === 1);
  assert("画布：主线卡带「锚定」tag + 副标题", (await page.locator(".canvas-card .anchor-tag").count()) === 1 && (await page.locator(".canvas-card .sub").count()) === 1);
  assert("画布：fitView 后主线卡可见", await page.locator(".canvas-card").isVisible());

  /* ---- 3) 回列开 2 个分支（划选辅助复用 verify2） ---- */
  await switchView(page, "列");
  assert("回列：画布卸载（.react-flow 清零）", (await page.locator(".react-flow").count()) === 0);
  await selectAndFork(page, "向量检索");
  await page.keyboard.press("Escape"); // 收起随分支弹出的 Artifact 抽屉
  await page.waitForTimeout(300);
  await selectAndFork(page, "图记忆");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  assert("列模式：3 列（主线 + 2 分支）", (await page.locator(".column").count()) === 3);

  /* ---- 4) 切画布：节点 3、边 2、edge label 脚注号 ---- */
  await enterCanvas(page);
  assert("画布：节点 3（新分支已入画布）", (await page.locator(".react-flow__node").count()) === 3);
  assert("画布：边 2（parentId → id）", (await page.locator(".react-flow__edge").count()) === 2);
  const labels = (await page.locator(".react-flow__edge-textwrapper").allTextContents()).map((s) => s.trim()).sort().join(",");
  assert("画布：edge label = 脚注号 1,2", labels === "1,2", labels);
  await page.screenshot({ path: DIR + "/v4-01-canvas-3nodes.png" });

  // 单击节点 → 选中高亮
  await page.locator('.react-flow__node:has-text("向量检索")').click();
  await page.waitForTimeout(250);
  assert("画布：单击节点 → .selected 高亮", (await page.locator(".react-flow__node.selected").count()) === 1);

  /* ---- 5) 双击「向量检索」节点 → 回列模式且该会话在某列可见 ---- */
  await page.locator('.react-flow__node:has-text("向量检索")').dblclick();
  await page.waitForTimeout(600);
  assert("双击节点：自动回到列模式", (await page.locator(".react-flow").count()) === 0);
  const titlesAfterDbl = (await page.locator(".ctitle").allInnerTexts()).join("|");
  assert("双击节点：「向量检索」在某列可见", titlesAfterDbl.includes("向量检索"), titlesAfterDbl);

  /* ---- 6) 再切画布，拖「图记忆」约 (+120,+80) → pin ---- */
  await enterCanvas(page);
  const gNode = page.locator('.react-flow__node:has-text("图记忆")');
  const gBox = await gNode.boundingBox();
  const preDragPos = await nodeFlowPos(page, "图记忆");
  const cx = gBox.x + gBox.width / 2;
  const cy = gBox.y + gBox.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 120, cy + 80, { steps: 8 }); // skill：必须分步 move
  await page.mouse.up();
  await page.waitForTimeout(300);
  const pinnedPos = await nodeFlowPos(page, "图记忆");
  assert(
    "拖拽：节点 flow 坐标发生位移（≈ +120/+80 ÷ zoom）",
    pinnedPos.x - preDragPos.x > 40 && pinnedPos.y - preDragPos.y > 30,
    `${fmt(preDragPos)} -> ${fmt(pinnedPos)}`,
  );
  assert("拖拽：Panel 显示「已固定 1」", (await page.locator(".canvas-panel").innerText()).includes("已固定 1"));
  await page.screenshot({ path: DIR + "/v4-02-drag-pin.png" });
  const preMainPos = await nodeFlowPos(page, "主线");

  /* ---- 7) 回列开第 3 个分支 → 切画布：新节点出现 + pin 不变 + 未 pin 节点重排 ---- */
  await switchView(page, "列");
  await selectAndFork(page, "Memory-as-Tool");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await enterCanvas(page);
  assert("新分支后：画布节点 4", (await page.locator(".react-flow__node").count()) === 4);
  assert("新分支后：边 3", (await page.locator(".react-flow__edge").count()) === 3);
  const pinnedPos2 = await nodeFlowPos(page, "图记忆");
  assert(
    "pin 生效：被拖节点位置不变（跨模式切换存活，±2px）",
    near(pinnedPos2.x, pinnedPos.x, 2) && near(pinnedPos2.y, pinnedPos.y, 2),
    `${fmt(pinnedPos)} -> ${fmt(pinnedPos2)}`,
  );
  const mainPos2 = await nodeFlowPos(page, "主线");
  assert(
    "未 pin 节点被重排：主线随 3 兄弟行加宽重新居中（x 位移 >20px）",
    Math.abs(mainPos2.x - preMainPos.x) > 20,
    `${fmt(preMainPos)} -> ${fmt(mainPos2)}`,
  );

  /* ---- 8) 重新排列：清 pin + dagre 重排 + fitView ---- */
  const tfBefore = await getTransform(page);
  await page.locator('.canvas-panel button:has-text("重新排列")').click();
  await page.waitForTimeout(800); // fitView 动画 320ms + 落定
  const tfAfter = await getTransform(page);
  const relaidPos = await nodeFlowPos(page, "图记忆");
  assert("重新排列：pin 清除（Panel 不再显示已固定）", !(await page.locator(".canvas-panel").innerText()).includes("已固定"));
  assert(
    "重新排列：被 pin 节点离开手拖位置，回到 dagre 槽位（位移 >30px）",
    Math.abs(relaidPos.x - pinnedPos2.x) + Math.abs(relaidPos.y - pinnedPos2.y) > 30,
    `${fmt(pinnedPos2)} -> ${fmt(relaidPos)}`,
  );
  const tfDelta =
    Math.abs(tfAfter.x - tfBefore.x) + Math.abs(tfAfter.y - tfBefore.y) + Math.abs(tfAfter.scale - tfBefore.scale) * 100;
  assert(
    "重新排列：fitView 生效（viewport transform 变化）",
    tfDelta > 2,
    `Δ=${tfDelta.toFixed(1)} (${tfBefore.x.toFixed(0)},${tfBefore.y.toFixed(0)},${tfBefore.scale.toFixed(2)}) -> (${tfAfter.x.toFixed(0)},${tfAfter.y.toFixed(0)},${tfAfter.scale.toFixed(2)})`,
  );
  await page.screenshot({ path: DIR + "/v4-03-relayout.png" });

  /* ---- 9) ⌘K 在画布模式打开并选一个分支 → 自动切回列模式且该会话打开 ---- */
  await page.keyboard.press("Control+k");
  await page.waitForSelector(".swx.global", { timeout: 3000 });
  assert("画布模式：⌘K 会话树可用（4 行）", (await page.locator(".swx-row").count()) === 4);
  await page.keyboard.type("图记忆");
  await page.waitForTimeout(250);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(700);
  assert("⌘K 选行：自动切回列模式", (await page.locator(".react-flow").count()) === 0 && (await page.locator(".column").count()) >= 2);
  const titlesAfterPalette = (await page.locator(".ctitle").allInnerTexts()).join("|");
  assert("⌘K 选行：「图记忆」已在列中打开", titlesAfterPalette.includes("图记忆"), titlesAfterPalette);

  /* ---- 收尾 ---- */
  assert("全程无 console error", errors.length === 0, errors.slice(0, 3).join(" ; "));

  console.log(`\n==== 结果：${passCount} PASS / ${failCount} FAIL ====`);
  await browser.close();
  if (failCount > 0) process.exit(1);
})().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
