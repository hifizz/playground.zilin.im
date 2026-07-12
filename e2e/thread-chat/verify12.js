/* Thread Chat demo 端到端验证 v12：真实模型接入（MiniMax / OpenAI 兼容）。
   双模式：
   · 服务端未配 MINIMAX_API_KEY（mock 模式）：断言 GET 探测 live=false、POST 503、
     页面 pill 显示 mock、开分支回落 canned 内容——然后跳过 live 部分正常退出；
   · 已配 key（live 模式）：断言 pill 显示模型名；划选开分支 → 首答由真实模型
     流式生成（非 canned、非空、status=done）；分支内追问同样成立；耗时按真实
     网络放宽（轮询至 90s）。
   运行：live 部分要求启动命令带出站代理支持（本容器：NODE_USE_ENV_PROXY=1 pnpm start）
   且环境网络策略放行 MINIMAX_BASE_URL 的域名。
   截图：v12-01 live 首答（仅 live 模式）。 */
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

/** 轮询最后一列最后一条 assistant 直到 done/error（live 网络耗时放宽到 90s） */
const waitReply = async (page, timeoutMs) => {
  const t0 = Date.now();
  for (;;) {
    const st = await page.evaluate(() => {
      const cols = document.querySelectorAll(".tc .cols > .column");
      const col = cols[cols.length - 1];
      const bs = col?.querySelectorAll('.bubble[data-role="assistant"]') ?? [];
      const b = bs[bs.length - 1];
      return { st: b?.dataset.status ?? "none", text: b?.textContent ?? "" };
    });
    if (st.st === "done" || st.st === "error") return st;
    if (Date.now() - t0 > timeoutMs) return st;
    await new Promise((r) => setTimeout(r, 500));
  }
};

/** canned 判定：与 data.ts 的 CANNED/REPLIES 开头片段比对 */
const CANNED_SNIPPETS = [
  "向量检索的核心是三步",
  "这是一条模拟回复",
  "演示回复：",
  "关于「",
];
const isCanned = (text) => CANNED_SNIPPETS.some((s) => text.includes(s));

(async () => {
  const base = "http://localhost:3000";
  const probe = await fetch(`${base}/api/thread-chat/reply`).then((r) => r.json());
  console.log(`模式探测: live=${probe.live} model=${probe.model ?? "-"}`);

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${base}/thread-chat`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  if (!probe.live) {
    /* ---- mock 模式：断言探测/503/回落，然后跳过 live 部分 ---- */
    const post = await fetch(`${base}/api/thread-chat/reply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "reply", messages: [{ role: "user", content: "hi" }] }),
    });
    assert("无 key：POST 返回 503", post.status === 503, String(post.status));
    assert("无 key：pill 显示 mock", (await page.locator(".demo-pill").innerText()).includes("mock"));
    await selectText(page, "图记忆");
    await page.locator(".sel-bubble .ask textarea").fill("这个问题足够长会让输入框换行并触发其内部滚动事件");
    await page.waitForTimeout(250);
    assert("长问题不触发气泡自毁（内部滚动放行）", (await page.locator(".sel-bubble").count()) === 1);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await selectText(page, "向量检索");
    await page.click(".sel-bubble button");
    const r = await waitReply(page, 5000);
    assert("无 key：开分支回落 canned 内容", r.st === "done" && isCanned(r.text), r.text.slice(0, 30));
    assert("全程无 console error", errors.length === 0, errors.join(" | "));
    console.log("\nSKIP: 服务端未配置 MINIMAX_API_KEY，live 冒烟部分跳过（回落链路已验证）");
  } else {
    /* ---- live 模式：真实模型流式 ---- */
    assert("pill 显示模型名", (await page.locator(".demo-pill").innerText()).includes(probe.model), await page.locator(".demo-pill").innerText());
    await selectText(page, "向量检索");
    await page.locator(".sel-bubble .ask textarea").fill("用一句话说清它和关键词检索的区别");
    await page.keyboard.down("Meta"); // ⌘Enter：直接开列（避开轻对话，走列路径便于断言）
    await page.keyboard.press("Enter");
    await page.keyboard.up("Meta");
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape"); // 收起可能弹出的 Artifact 抽屉
    const first = await waitReply(page, 90_000);
    assert("live 首答 done 且非空", first.st === "done" && first.text.length > 10, `${first.st} ${first.text.slice(0, 40)}`);
    assert("live 首答非 canned（真实生成）", !isCanned(first.text), first.text.slice(0, 40));
    assert("live 首答不含 <think> 残留", !first.text.includes("<think>") && !first.text.includes("</think>"));
    await page.screenshot({ path: `${DIR}/v12-01-live-reply.png` });

    const ta = page.locator(".column.branch textarea").first();
    await ta.fill("再举一个具体例子");
    await ta.press("Enter");
    const second = await waitReply(page, 90_000);
    assert("live 追问 done 且非 canned", second.st === "done" && !isCanned(second.text), `${second.st} ${second.text.slice(0, 40)}`);
    assert("全程无 console error", errors.length === 0, errors.join(" | "));
  }

  await browser.close();
  console.log(`\n==== 结果：${passCount} PASS / ${failCount} FAIL ====`);
  process.exit(failCount ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
