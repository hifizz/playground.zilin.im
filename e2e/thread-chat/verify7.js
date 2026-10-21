/* Thread Chat demo 端到端验证 v7：流式内核（Message.status + ReplyProvider mock）。
   覆盖：
   · fork 首答流式：开分支后立即出现 pending/streaming 占位，文本逐帧增长，
     最终 done 且为锚点话题的 canned 内容；
   · 发消息流式：user + pending assistant 同步入树（+2 条），流式期间发送按钮
     禁用（「生成中…」）、重复提交被拒（消息数不变），完成后按钮恢复；
   · error / 重试：消息含 [error] 触发 mock 失败 → data-status=error + 错误行 +
     重试按钮；点重试立即回 pending、再次失败仍 error；error 不阻塞后续正常发送；
   · 流式期间与全程 console error 为零。
   截图：v7-01 流式中 / v7-02 error 态。 */
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

/** 页面内轮询采样：最后一列最后一条 assistant 气泡的 (status, 文本长度)，直到 done/error 或超时 */
const sampleStream = (page) =>
  page.evaluate(async () => {
    const read = () => {
      const cols = document.querySelectorAll(".tc .cols > .column");
      const col = cols[cols.length - 1];
      const bubbles = col?.querySelectorAll('.bubble[data-role="assistant"]') ?? [];
      const b = bubbles[bubbles.length - 1];
      return { st: b?.dataset.status ?? "none", len: (b?.textContent ?? "").length };
    };
    const samples = [read()];
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 25));
      samples.push(read());
      const st = samples[samples.length - 1].st;
      if (st === "done" || st === "error") break;
    }
    return samples;
  });

const branchMsgCount = (page) => page.locator(".column.branch").first().locator(".message").count();

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("http://localhost:3000/thread-chat", { waitUntil: "networkidle" });

  /* ---- A) fork 首答流式 ---- */
  await selectText(page, "向量检索");
  await page.click(".sel-bubble button");
  const forkSamples = await sampleStream(page);
  {
    const first = forkSamples[0];
    const last = forkSamples[forkSamples.length - 1];
    const midStates = forkSamples.slice(0, -1).map((s) => s.st);
    assert(
      "fork 后立即出现占位（pending/streaming）",
      first.st === "pending" || first.st === "streaming",
      JSON.stringify(first),
    );
    assert("首答流式最终 done", last.st === "done", JSON.stringify(forkSamples));
    assert(
      "流式过程可观察（存在中间态且文本增长）",
      midStates.some((s) => s === "pending" || s === "streaming") && last.len > first.len,
      `${forkSamples.length} samples, ${first.len} -> ${last.len}`,
    );
    const text = await page.locator('.column.branch .bubble[data-role="assistant"]').first().textContent();
    assert("首答内容 = 锚点话题 canned 文本", text.includes("Embedding"), text.slice(0, 40));
  }
  await page.keyboard.press("Escape"); // 收起 Artifact 抽屉
  await page.waitForTimeout(300);

  /* ---- B) 发消息流式 + busy 拒绝 ---- */
  const before = await branchMsgCount(page);
  const ta = page.locator(".column.branch textarea").first();
  await ta.fill("继续解释一下切分策略");
  await ta.press("Enter");
  await page.waitForTimeout(60);
  {
    const after = await branchMsgCount(page);
    assert("发消息：user + pending 同步 +2 条", after === before + 2, `${before} -> ${after}`);
    const sendBtn = page.locator(".column.branch .send").first();
    assert("流式期间发送按钮禁用", await sendBtn.isDisabled());
    assert("流式期间按钮文案 = 生成中…", (await sendBtn.innerText()).includes("生成中"));
    await page.screenshot({ path: `${DIR}/v7-01-streaming.png` });
    await ta.fill("插队消息");
    await ta.press("Enter");
    await page.waitForTimeout(80);
    assert("流式期间重复提交被拒", (await branchMsgCount(page)) === before + 2);
  }
  await page.waitForTimeout(600);
  {
    const lastBubble = page.locator('.column.branch .bubble[data-role="assistant"]').last();
    assert("追问回复流式完成（done 且非空）", (await lastBubble.getAttribute("data-status")) === "done" && ((await lastBubble.textContent()) ?? "").length > 10);
    const sendBtn = page.locator(".column.branch .send").first();
    assert("完成后发送按钮恢复", !(await sendBtn.isDisabled()) && (await sendBtn.innerText()) === "发送");
  }

  /* ---- C) error / 重试 ---- */
  await ta.fill("插队消息"); // 上面被拒时留在框里的文字已被 fill 覆盖，这里清干净重来
  await ta.fill("[error] 模拟一次生成失败");
  await ta.press("Enter");
  await page.waitForTimeout(700);
  {
    const lastBubble = page.locator('.column.branch .bubble[data-role="assistant"]').last();
    assert("[error] 消息触发 error 态", (await lastBubble.getAttribute("data-status")) === "error");
    assert("错误行 + 重试按钮出现", (await page.locator(".column.branch .msg-error .retry").count()) === 1);
    await page.screenshot({ path: `${DIR}/v7-02-error.png` });
    await page.click(".column.branch .msg-error .retry");
    await page.waitForTimeout(60);
    const stNow = await lastBubble.getAttribute("data-status");
    assert("点重试立即回 pending/streaming", stNow === "pending" || stNow === "streaming", stNow);
    await page.waitForTimeout(700);
    assert("重试后（输入仍含 [error]）再次失败", (await lastBubble.getAttribute("data-status")) === "error");
  }

  /* ---- D) error 不阻塞后续正常发送 ---- */
  await ta.fill("换个正常问题");
  await ta.press("Enter");
  await page.waitForTimeout(700);
  {
    const lastBubble = page.locator('.column.branch .bubble[data-role="assistant"]').last();
    assert("error 后仍可正常发消息并完成", (await lastBubble.getAttribute("data-status")) === "done");
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
