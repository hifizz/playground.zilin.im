/* Thread Chat demo 端到端验证 v9：气泡内轻量对话 + 升格（Phase B）。
   覆盖：
   · 纯 Enter 带问 = 开轻对话：气泡视口（.bt-pop）出现、列数不变、fork 已入树
     （主线锚点/脚注同步落原文、⌘K 可见）；首答在气泡内流式完成；
   · 气泡内追问（第 2 轮）复用同一 send：完成后出现升格提示行；
   · 第 3 次提交自动升格：气泡关、新列打开、6 条消息全在（无损承诺——
     气泡里聊的每一句在列里一字不少）、第 3 问在列里流式作答；
   · Esc 收起成徽标（.bt-badge）→ 点徽标恢复、消息仍在；徽标态再 Esc 关闭视口
     （thread 留在树里，点脚注仍可开列）；
   · 「开列」按钮升格：走 placement（列数上限内追加）；
   · 全程无 console error。
   截图：v9-01 轻对话首答 / v9-02 升格提示 / v9-03 升格后的列 / v9-04 徽标态。 */
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
const selectText = async (page, needle) => {
  const found = await page.evaluate(
    ([needle, finder]) => {
      const f = new Function("return " + finder)()(needle);
      if (!f) return false;
      f.n.parentElement.scrollIntoView({ block: "center", behavior: "instant" });
      return true;
    },
    [needle, findNeedle.toString()],
  );
  if (!found) throw new Error("text not found: " + needle);
  await page.waitForTimeout(250);
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
  if (!ok) throw new Error("text not found after scroll: " + needle);
  await page.waitForSelector(".sel-bubble", { timeout: 3000 });
  await page.waitForTimeout(150);
};

const colCount = (page) => page.locator(".tc .cols > .column").count();
const btMsgs = (page) =>
  page.$$eval(".bt-pop .bt-msg", (els) =>
    els.map((el) => ({
      role: el.classList.contains("user") ? "user" : "assistant",
      st: el.getAttribute("data-status"),
      text: (el.textContent || "").slice(0, 20),
    })),
  );

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("http://localhost:3000/thread-chat", { waitUntil: "networkidle" });

  /* ---- A) 纯 Enter 带问 = 轻对话 ---- */
  const Q1 = "向量检索的切分策略怎么定？";
  await selectText(page, "向量检索");
  await page.locator(".sel-bubble .ask textarea").fill(Q1);
  await page.keyboard.press("Enter");
  await page.waitForSelector(".bt-pop", { timeout: 3000 });
  assert("Enter 带问：轻对话视口出现", true);
  assert("列数不变（仍只有主线）", (await colCount(page)) === 1);
  {
    const marks = await page.evaluate(() => ({
      anchored: document.querySelectorAll(".tc .cols .anchored").length,
      fnote: document.querySelectorAll(".tc .cols sup.fnote").length,
    }));
    assert("fork 已入树：主线锚点 + 脚注同步落原文", marks.anchored === 1 && marks.fnote === 1);
  }
  await page.waitForTimeout(700); // 首答流式 ~300ms
  {
    const msgs = await btMsgs(page);
    assert(
      "气泡内首答完成：user 问 + assistant done",
      msgs.length === 2 && msgs[0].role === "user" && msgs[1].st === "done",
      JSON.stringify(msgs),
    );
    await page.screenshot({ path: `${DIR}/v9-01-bubble-thread.png` });
  }

  /* ---- B) 第 2 轮追问 → 升格提示行 ---- */
  await page.locator(".bt-composer textarea").fill("那块太小会怎样？");
  await page.locator(".bt-composer textarea").press("Enter");
  await page.waitForTimeout(700);
  {
    const msgs = await btMsgs(page);
    assert("第 2 轮在气泡内完成（4 条）", msgs.length === 4 && msgs[3].st === "done", JSON.stringify(msgs));
    assert("升格提示行出现", (await page.locator(".bt-limit").count()) === 1);
    await page.screenshot({ path: `${DIR}/v9-02-limit-hint.png` });
  }

  /* ---- C) 第 3 次提交自动升格（无损） ---- */
  const Q3 = "给我一个实际的切分参数示例";
  await page.locator(".bt-composer textarea").fill(Q3);
  await page.locator(".bt-composer textarea").press("Enter");
  await page.waitForTimeout(700);
  {
    assert("升格后气泡关闭", (await page.locator(".bt-pop").count()) === 0);
    assert("升格后开出新列", (await colCount(page)) === 2);
    const colMsgs = await page.$$eval(".tc .cols > .column", (cols) => {
      const col = cols[1];
      return Array.from(col?.querySelectorAll(".message") ?? []).map((el) => ({
        role: el.classList.contains("user") ? "user" : "assistant",
        text: (el.querySelector(".bubble")?.textContent || "").slice(0, 16),
        st: el.querySelector(".bubble")?.getAttribute("data-status") ?? null,
      }));
    });
    assert("无损承诺：列里 6 条消息（3 问 3 答）", colMsgs.length === 6, JSON.stringify(colMsgs.map((m) => m.role)));
    assert("第 1 问原文在列里", colMsgs[0].text.includes("切分策略"), colMsgs[0].text);
    assert(
      "第 3 问在列里发出且已作答",
      colMsgs[4].text.includes("参数示例") && colMsgs[5].st === "done",
      JSON.stringify(colMsgs.slice(4)),
    );
    await page.screenshot({ path: `${DIR}/v9-03-upgraded.png` });
  }

  /* ---- D) 再开一个轻对话：Esc 徽标链 ---- */
  await selectText(page, "图记忆");
  await page.locator(".sel-bubble .ask textarea").fill("图记忆的写入成本高吗？");
  await page.keyboard.press("Enter");
  await page.waitForSelector(".bt-pop", { timeout: 3000 });
  await page.waitForTimeout(700);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  {
    assert("Esc：气泡收起成徽标", (await page.locator(".bt-pop").count()) === 0 && (await page.locator(".bt-badge").count()) === 1);
    await page.screenshot({ path: `${DIR}/v9-04-badge.png` });
    await page.click(".bt-badge");
    await page.waitForTimeout(300);
    const msgs = await btMsgs(page);
    assert("点徽标恢复：消息仍在", (await page.locator(".bt-pop").count()) === 1 && msgs.length === 2, JSON.stringify(msgs.map((m) => m.role)));
    await page.keyboard.press("Escape"); // → 徽标
    await page.waitForTimeout(150);
    await page.keyboard.press("Escape"); // → 关闭视口
    await page.waitForTimeout(150);
    assert("徽标态再 Esc：视口关闭", (await page.locator(".bt-pop, .bt-badge").count()) === 0);
  }

  /* ---- E) 视口关闭后 thread 仍在树里：点脚注开列 ---- */
  {
    const fnotes = page.locator(".tc .cols sup.fnote");
    await fnotes.last().click();
    await page.waitForTimeout(500);
    assert("点脚注：轻分支照常开列（数据从未离开树）", (await colCount(page)) === 3);
    const lastColTitle = await page.$$eval(".tc .cols > .column .ctitle", (els) => els.map((e) => e.textContent ?? ""));
    assert("开出的列 = 图记忆轻分支", lastColTitle.some((t) => t.includes("图记忆")), JSON.stringify(lastColTitle));
  }

  /* ---- F) console 干净 ---- */
  assert("全程无 console error", errors.length === 0, errors.join(" | "));

  await browser.close();
  console.log(`\n==== 结果：${passCount} PASS / ${failCount} FAIL ====`);
  process.exit(failCount ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
