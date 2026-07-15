/* Thread Chat demo 端到端验证 v8：模型就绪化三件套（§10.4 / §10.5 / §10.6）。
   覆盖：
   · 锚点鲁棒定位（TextQuoteSelector 思路）：主线里「长期记忆」出现两次，划选
     第二次出现开分支 → 锚点高亮落在第二处（旧 indexOf 顺延会错落到第一处）；
   · 分支异步标题：锚点为长句时初始标题 = 锚点截断，首答完成后 mock provider
     命中 canned 话题 → 标题异步更新为话题名，列头 / ⌘K 跟随；
   · localStorage 持久化：开分支后刷新页面 → 树完整恢复（原文锚点/脚注、⌘K
     行数、异步生成的标题都在）；顶栏「重置」→ 清档回种子；
   · 全程无 console error。
   截图：v8-01 第二处锚定 / v8-02 刷新后恢复。 */
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

/* 划选辅助：支持指定第 nth 次出现（0 基，按 DOM 文本顺序数 assistant 气泡内的命中） */
const findNth = (needle, nth) => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let count = 0;
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!n.parentElement || !n.parentElement.closest('.bubble[data-role="assistant"]')) continue;
    const tx = n.textContent || "";
    let i = tx.indexOf(needle);
    while (i !== -1) {
      if (count === nth) return { n, i };
      count++;
      i = tx.indexOf(needle, i + 1);
    }
  }
  return null;
};
const selectNth = async (page, needle, nth) => {
  const found = await page.evaluate(
    ([needle, nth, finder]) => {
      const f = new Function("return " + finder)()(needle, nth);
      if (!f) return false;
      f.n.parentElement.scrollIntoView({ block: "center", behavior: "instant" });
      return true;
    },
    [needle, nth, findNth.toString()],
  );
  if (!found) throw new Error(`occurrence ${nth} not found: ${needle}`);
  await page.waitForTimeout(250);
  const ok = await page.evaluate(
    ([needle, nth, finder]) => {
      const f = new Function("return " + finder)()(needle, nth);
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
    [needle, nth, findNth.toString()],
  );
  if (!ok) throw new Error(`occurrence ${nth} lost after scroll: ${needle}`);
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

  /* ---- A) 划选第二次出现的「长期记忆」：锚点落在第二处 ---- */
  await selectNth(page, "长期记忆", 1); // 第 1 处在第一段，第 2 处在第二段开头
  await page.click(".sel-bubble button");
  await page.waitForTimeout(600);
  {
    const info = await page.evaluate(() => {
      const cols = document.querySelectorAll(".tc .cols > .column");
      const anchors = cols[0]?.querySelectorAll(".anchored") ?? [];
      const a = anchors[0];
      return {
        count: anchors.length,
        para: a?.closest("p")?.textContent?.slice(0, 10) ?? "",
      };
    });
    assert("开出分支且主线有 1 个锚点", info.count === 1, JSON.stringify(info));
    assert(
      "锚点高亮落在第二次出现的段落（要让长期记忆…）",
      info.para.startsWith("要让"),
      info.para,
    );
    await page.screenshot({ path: `${DIR}/v8-01-second-occurrence.png` });
  }

  /* ---- B) 异步分支标题：长锚点 → 首答完成后更新为话题名 ---- */
  await selectNth(page, "短期记忆，对应一次完整的会话", 0);
  await page.click(".sel-bubble button");
  await page.waitForTimeout(120); // 标题生成前：仍是锚点截断
  {
    const titles = await page.$$eval(".tc .cols > .column .ctitle", (els) =>
      els.map((e) => e.textContent ?? ""),
    );
    assert(
      "首答未完成时标题 = 锚点截断",
      titles.some((t) => t.startsWith("短期记忆，对应") && t.includes("…")),
      JSON.stringify(titles),
    );
  }
  await page.waitForTimeout(800); // 流式 ~300ms + 标题 mock 120ms + 缓冲
  {
    const titles = await page.$$eval(".tc .cols > .column .ctitle", (els) =>
      els.map((e) => e.textContent ?? ""),
    );
    assert(
      "首答完成后标题异步更新为话题名「短期记忆」",
      titles.includes("短期记忆"),
      JSON.stringify(titles),
    );
  }

  /* ---- C) 持久化：刷新恢复 ---- */
  await page.waitForTimeout(800); // 防抖 400ms 的存盘窗口
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  {
    const marks = await page.evaluate(() => {
      const cols = document.querySelectorAll(".tc .cols > .column");
      return {
        cols: cols.length,
        anchored: cols[0]?.querySelectorAll(".anchored").length ?? 0,
        fnotes: cols[0]?.querySelectorAll("sup.fnote").length ?? 0,
      };
    });
    assert("刷新后主线锚点/脚注恢复（2 个分支）", marks.anchored === 2 && marks.fnotes === 2, JSON.stringify(marks));
    await page.keyboard.press("Control+k");
    await page.waitForSelector(".swx.global", { timeout: 3000 });
    assert("刷新后 ⌘K 行数 = 3（主线 + 2 分支）", (await page.locator(".swx-row").count()) === 3);
    const rowTitles = await page.locator(".swx-row .t").allInnerTexts();
    assert(
      "异步生成的标题也持久化了",
      rowTitles.some((t) => t.includes("短期记忆") && !t.includes("…")),
      JSON.stringify(rowTitles),
    );
    await page.keyboard.press("Escape");
    await page.screenshot({ path: `${DIR}/v8-02-restored.png` });
  }

  /* ---- D) 重置：清档回种子 ---- */
  await page.click('.tc .topbar button[title*="回到演示种子"]');
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);
  {
    const marks = await page.evaluate(() => {
      const cols = document.querySelectorAll(".tc .cols > .column");
      return {
        anchored: cols[0]?.querySelectorAll(".anchored").length ?? 0,
        stored: localStorage.getItem("tc-thread-state-v1"),
      };
    });
    assert("重置后回到种子（无锚点）", marks.anchored === 0);
    // 重置后 store 会把种子重新存盘（防抖后），只要求树回到单主线即可
    await page.keyboard.press("Control+k");
    await page.waitForSelector(".swx.global", { timeout: 3000 });
    assert("重置后 ⌘K 只剩主线", (await page.locator(".swx-row").count()) === 1);
    await page.keyboard.press("Escape");
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
