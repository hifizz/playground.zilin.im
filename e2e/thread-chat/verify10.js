/* Thread Chat demo 端到端验证 v10：画布 Phase 2 —— 节点内对话 + 画布内划选开分支。
   覆盖：
   · 单击节点 → 外挂对话面板（.canvas-expand）出现：消息列表 + composer；
     卡片摘要收起（避免与面板重复）；
   · 节点内发消息：user + pending 入树、面板内流式完成、卡片消息计数 +2；
   · 画布内划选面板里的 AI 文字 → 划选气泡出现（无迷你列条——画布不占列槽）；
     带问提交 → 新节点长出（节点/边 +1、edge label 新脚注号）、自动选中展开、
     面板首条为该 user 问题；列模式的列数不受影响（fork 未占列槽）；
   · 新节点面板内继续追问正常；双击节点仍回列模式（Phase 1 行为不变）；
   · 全程无 console error。
   截图：v10-01 节点展开 / v10-02 画布划选 / v10-03 新节点长出。 */
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

/* 划选辅助（与 verify2 同构；画布面板里的消息同样满足 .bubble[data-role] 契约） */
const findNeedle = (needle) => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    const i = (n.textContent || "").indexOf(needle);
    if (i >= 0 && n.parentElement && n.parentElement.closest('.bubble[data-role="assistant"]'))
      return { n, i };
  }
  return null;
};
const selectInCanvas = async (page, needle) => {
  const ok = await page.evaluate(
    ([needle, finder]) => {
      const f = new Function("return " + finder)()(needle);
      if (!f) return false;
      const r = document.createRange();
      r.setStart(f.n, f.i);
      r.setEnd(f.n, f.i + needle.length);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      return true;
    },
    [needle, findNeedle.toString()],
  );
  if (!ok) throw new Error("text not found in canvas: " + needle);
  await page.waitForSelector(".sel-bubble", { timeout: 3000 });
  await page.waitForTimeout(150);
};

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("http://localhost:3000/thread-chat", { waitUntil: "networkidle" });

  /* ---- A) 进画布，单击主线节点 → 外挂面板 ---- */
  await page.locator(".topbar .seg button.mode", { hasText: "画布" }).click();
  await page.waitForSelector(".react-flow__node", { timeout: 8000 });
  await page.waitForTimeout(600);
  await page.locator('.react-flow__node:has-text("主线")').click();
  await page.waitForTimeout(300);
  assert("单击节点：外挂对话面板出现", (await page.locator(".canvas-expand").count()) === 1);
  assert(
    "面板含消息列表 + composer",
    (await page.locator(".canvas-expand .msg-list .message").count()) === 2 &&
      (await page.locator(".canvas-expand .cv-composer textarea").count()) === 1,
  );
  assert("展开时卡片摘要收起", (await page.locator(".react-flow__node.selected .canvas-card > .sum").count()) === 0);
  await page.screenshot({ path: `${DIR}/v10-01-expand.png` });

  /* ---- B) 节点内发消息（流式） ---- */
  await page.locator(".canvas-expand .cv-composer textarea").fill("在画布里问一句");
  await page.locator(".canvas-expand .cv-composer textarea").press("Enter");
  await page.waitForTimeout(80);
  assert("节点内发消息：+2 条同步入树", (await page.locator(".canvas-expand .msg-list .message").count()) === 4);
  await page.waitForTimeout(700);
  {
    const st = await page
      .locator('.canvas-expand .bubble[data-role="assistant"]')
      .last()
      .getAttribute("data-status");
    assert("面板内回复流式完成", st === "done", st);
    const meta = await page.locator(".react-flow__node.selected .canvas-card .meta").innerText();
    assert("卡片消息计数 = 4", meta.includes("4 条消息"), meta);
  }

  /* ---- C) 画布内划选开分支 ---- */
  const nodesBefore = await page.locator(".react-flow__node").count();
  await selectInCanvas(page, "向量检索");
  assert("画布划选：气泡出现", (await page.locator(".sel-bubble").count()) === 1);
  assert("画布气泡无迷你列条（不占列槽）", (await page.locator(".sel-bubble .slotmap").count()) === 0);
  await page.screenshot({ path: `${DIR}/v10-02-canvas-select.png` });
  await page.locator(".sel-bubble .ask textarea").fill("画布里带问开分支");
  await page.keyboard.press("Enter"); // 画布无轻对话：Enter 落到 fork
  await page.waitForTimeout(900);
  {
    const nodesAfter = await page.locator(".react-flow__node").count();
    assert("新节点长出（+1）", nodesAfter === nodesBefore + 1, `${nodesBefore} -> ${nodesAfter}`);
    assert("新节点自动选中并展开", (await page.locator(".react-flow__node.selected").count()) === 1);
    const firstMsg = await page.locator(".canvas-expand .msg-list .message").first().innerText();
    assert("新节点面板首条 = 画布划选带的问题", firstMsg.includes("画布里带问开分支"), firstMsg);
    assert("边 +1", (await page.locator(".react-flow__edge").count()) === 1);
    await page.screenshot({ path: `${DIR}/v10-03-new-node.png` });
  }

  /* ---- D) 新节点内追问 + 双击回列 ---- */
  await page.locator(".canvas-expand .cv-composer textarea").fill("在新节点里追问");
  await page.locator(".canvas-expand .cv-composer textarea").press("Enter");
  await page.waitForTimeout(700);
  assert(
    "新节点内追问完成（4 条）",
    (await page.locator(".canvas-expand .msg-list .message").count()) === 4,
  );
  await page.locator('.react-flow__node:has-text("主线")').dblclick();
  await page.waitForTimeout(600);
  assert("双击节点仍回列模式", (await page.locator(".react-flow").count()) === 0);
  {
    const cols = await page.locator(".tc .cols > .column").count();
    // 画布 fork 不占列槽：回列后只有主线一列（分支经 ⌘K / 脚注按需打开）
    assert("画布 fork 未污染列槽（回列仅主线）", cols === 1, String(cols));
    const marks = await page.evaluate(() => document.querySelectorAll(".tc .cols .anchored").length);
    assert("画布 fork 的锚点在列模式原文可见", marks === 1, String(marks));
  }

  /* ---- E) console 干净 ---- */
  assert("全程无 console error", errors.length === 0, errors.join(" | "));

  await browser.close();
  console.log(`\n==== 结果：${passCount} PASS / ${failCount} FAIL ====`);
  process.exit(failCount ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
