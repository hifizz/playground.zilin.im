/* Thread Chat demo 端到端验证 v11：移动端形态（390×844 视口）。
   覆盖：
   · 窄屏默认视图 = 画布（fitView 一屏纵览，顶栏「画布」按钮 on）；
   · 单击画布节点 → bottom sheet 唤起（半屏）：头部 / 消息列表 / composer；
     桌面的外挂面板（.canvas-expand）在窄屏隐藏；
   · sheet 内发消息：user + pending 入树、流式完成；卡片计数跟随；
   · 拉满 ⇄ 还原（.full class 与实际高度变化）；关闭后 sheet 消失、会话仍在树里
     （再点节点重新唤起，消息还在）；
   · 窄屏仍可手动切回列视图（clamp 到 2 列）；
   · 全程无 console error。
   截图：v11-01 移动画布 / v11-02 sheet / v11-03 拉满。 */
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

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium",
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("http://localhost:3000/thread-chat", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  /* ---- A) 窄屏默认 = 画布 ---- */
  await page.waitForSelector(".react-flow__node", { timeout: 8000 });
  assert("窄屏默认视图 = 画布", (await page.locator(".react-flow").count()) === 1);
  assert(
    "顶栏「画布」按钮处于 on",
    (await page.locator(".topbar .seg button.mode.on", { hasText: "画布" }).count()) === 1,
  );
  await page.screenshot({ path: `${DIR}/v11-01-mobile-canvas.png` });

  /* ---- B) 单击节点 → sheet；桌面外挂面板隐藏 ---- */
  await page.locator('.react-flow__node[data-id="main"]').click();
  await page.waitForSelector(".sheet", { timeout: 3000 });
  assert("单击节点：bottom sheet 唤起", true);
  assert("sheet 含消息与 composer", (await page.locator(".sheet .bt-msg").count()) === 2 && (await page.locator(".sheet-composer textarea").count()) === 1);
  assert("窄屏下桌面外挂面板不可见", !(await page.locator(".canvas-expand").first().isVisible().catch(() => false)));
  await page.screenshot({ path: `${DIR}/v11-02-sheet.png` });

  /* ---- C) sheet 内发消息（流式） ---- */
  await page.locator(".sheet-composer textarea").fill("移动端的第一个问题");
  await page.locator(".sheet-composer textarea").press("Enter");
  await page.waitForTimeout(80);
  assert("sheet 发消息：+2 条同步入树", (await page.locator(".sheet .bt-msg").count()) === 4);
  await page.waitForTimeout(700);
  {
    const st = await page.locator(".sheet .bt-msg.assistant").last().getAttribute("data-status");
    assert("sheet 内回复流式完成", st === "done", st);
  }

  /* ---- D) 拉满 ⇄ 还原 ---- */
  const h0 = (await page.locator(".sheet").boundingBox())?.height ?? 0;
  await page.click('.sheet-head button[title*="拉满"]');
  await page.waitForTimeout(450);
  {
    const hasFull = await page.locator(".sheet.full").count();
    const h1 = (await page.locator(".sheet").boundingBox())?.height ?? 0;
    assert("拉满：.full 且高度显著增加", hasFull === 1 && h1 > h0 + 150, `${h0} -> ${h1}`);
    await page.screenshot({ path: `${DIR}/v11-03-full.png` });
  }
  await page.click('.sheet-head button[title*="还原"]');
  await page.waitForTimeout(450);
  assert("还原为半屏", (await page.locator(".sheet.full").count()) === 0);

  /* ---- E) 关闭与重新唤起（会话在树里） ---- */
  await page.click('.sheet-head button[title*="收起"]');
  await page.waitForTimeout(250);
  assert("关闭后 sheet 消失", (await page.locator(".sheet").count()) === 0);
  await page.locator('.react-flow__node[data-id="main"]').click();
  await page.waitForSelector(".sheet", { timeout: 3000 });
  assert("重新唤起：消息仍在（4 条）", (await page.locator(".sheet .bt-msg").count()) === 4);
  await page.click('.sheet-head button[title*="收起"]');
  await page.waitForTimeout(250);

  /* ---- F) 窄屏手动切回列视图（clamp 2 列） ---- */
  await page.locator(".topbar .seg button.mode", { hasText: "列" }).click();
  await page.waitForTimeout(500);
  assert("窄屏可切回列视图", (await page.locator(".tc .cols > .column").count()) >= 1);

  /* ---- G) console 干净 ---- */
  assert("全程无 console error", errors.length === 0, errors.join(" | "));

  await browser.close();
  console.log(`\n==== 结果：${passCount} PASS / ${failCount} FAIL ====`);
  process.exit(failCount ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
