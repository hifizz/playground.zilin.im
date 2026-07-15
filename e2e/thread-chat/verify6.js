/* Thread Chat demo 端到端验证 v6：气泡输入框（fork 首条消息策略 Phase A）——列路径。
   覆盖：
   · 气泡结构：划选后气泡含可选输入框（placeholder / 弹出即聚焦）；
   · 留空提交 = 现状路径：点按钮开分支，新列首条为 assistant（无 user 消息）；
   · 带问提交（点按钮）：输入问题后点「带着问题开分支」→ 新列第 1 条为该 user
     消息、第 2 条为 assistant，标题仍取锚点，脚注 / 锚点高亮照常落原文；
   · 按钮文案三态：空 =「开启分支讨论」，有输入 =「带着问题开分支」，⌘ 优先；
   · Shift+Enter 换行不提交；输入中 Esc 关气泡且无消息入树；
   · ⌘Enter 带问 keepSource：列满时替换来源邻右列、来源列保留（对齐 verify5 语义）；
   · 全程无 console error。
   注：Phase B（气泡轻对话）起，「纯 Enter 带问」的语义改为开气泡内轻对话，
   由 verify9 覆盖；本套件覆盖的列路径（按钮 / ⌘Enter / override）语义不变。
   截图：v6-01 气泡含输入框 / v6-02 带问开出的分支列 / v6-03 ⌘Enter 后列局面。 */
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

/* —— 复用 verify2/5 的划选辅助（划选弹气泡，不点按钮）—— */
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

/** 列行快照：DOM 顺序的展开列 / 细条（kind + 标题） */
const rowSnap = (page) =>
  page.$$eval(".tc .cols > .column, .tc .cols > .col-strip", (els) =>
    els.map((el) => ({
      kind: el.classList.contains("col-strip") ? "strip" : "col",
      title: (el.querySelector(".ctitle") || el.querySelector(".vt"))?.textContent ?? "",
    })),
  );
const fmtRow = (r) => r.map((c) => `${c.kind === "strip" ? "▍" : ""}${c.title}`).join(" | ");

/** 某列（0 基，仅数展开列；.cols 里还有分割线等兄弟节点，不能用 nth-of-type）
    消息序列快照：[{role, text 前 30 字}] */
const colMsgs = (page, colIdx) =>
  page.$$eval(
    ".tc .cols > .column",
    (cols, idx) =>
      Array.from(cols[idx]?.querySelectorAll(".message") ?? []).map((el) => ({
        role: el.classList.contains("user") ? "user" : "assistant",
        text: (el.querySelector(".bubble")?.textContent || "").slice(0, 30),
      })),
    colIdx,
  );

const btnLabel = (page) => page.locator(".sel-bubble button").innerText();

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium",
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("http://localhost:3000/thread-chat", { waitUntil: "networkidle" });

  /* ---- A) 气泡结构：输入框存在、placeholder、弹出即聚焦 ---- */
  await selectText(page, "向量检索");
  assert("气泡含输入框", (await page.locator(".sel-bubble .ask textarea").count()) === 1);
  assert(
    "输入框 placeholder 提示可留空",
    (await page.locator(".sel-bubble .ask textarea").getAttribute("placeholder"))?.includes("留空"),
  );
  assert(
    "弹出即聚焦输入框",
    await page.evaluate(() => document.activeElement?.closest?.(".sel-bubble .ask") != null),
  );
  assert("空输入按钮文案 = 开启分支讨论", (await btnLabel(page)) === "开启分支讨论");
  await page.screenshot({ path: `${DIR}/v6-01-bubble-with-input.png` });

  /* ---- B) 留空提交 = 现状路径：首条为 assistant、无 user 消息 ---- */
  await page.click(".sel-bubble button");
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape"); // 收起自动弹出的 Artifact 抽屉
  await page.waitForTimeout(300);
  {
    const rows = await rowSnap(page);
    assert("留空提交：开出 2 列", rows.length === 2, fmtRow(rows));
    const msgs = await colMsgs(page, 1);
    assert("留空分支首条 = assistant（引导回复）", msgs[0]?.role === "assistant", JSON.stringify(msgs));
    assert("留空分支无 user 消息", msgs.every((m) => m.role === "assistant"));
  }

  /* ---- C) 带问提交（点按钮 = 列路径）：user 首问 + assistant 首答 ---- */
  const QUESTION = "它和图记忆相比该怎么选？";
  await selectText(page, "图记忆");
  await page.locator(".sel-bubble .ask textarea").fill(QUESTION);
  assert("有输入时按钮文案 = 带着问题开分支", (await btnLabel(page)) === "带着问题开分支");
  await page.click(".sel-bubble button");
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape"); // 图记忆分支带 Artifact，收起抽屉
  await page.waitForTimeout(300);
  {
    const rows = await rowSnap(page);
    assert("带问提交：开出 3 列", rows.length === 3, fmtRow(rows));
    assert("新列标题取锚点", rows[2].title.includes("图记忆"), rows[2].title);
    const msgs = await colMsgs(page, 2);
    assert("带问分支第 1 条 = user 且为所输入问题", msgs[0]?.role === "user" && msgs[0].text.includes("怎么选"), JSON.stringify(msgs[0]));
    assert("带问分支第 2 条 = assistant", msgs[1]?.role === "assistant", JSON.stringify(msgs[1]));
    const mainMarks = await page.$$eval(".tc .cols > .column", (cols) => ({
      anchored: cols[0]?.querySelectorAll(".anchored").length ?? 0,
      fnotes: cols[0]?.querySelectorAll("sup.fnote").length ?? 0,
    }));
    assert("脚注锚点照常落原文", mainMarks.anchored >= 2 && mainMarks.fnotes >= 2, JSON.stringify(mainMarks));
    await page.screenshot({ path: `${DIR}/v6-02-question-branch.png` });
  }

  /* ---- D) Shift+Enter 换行不提交 ---- */
  await selectText(page, "上下文腐烂");
  await page.locator(".sel-bubble .ask textarea").pressSequentially("第一行");
  await page.keyboard.press("Shift+Enter");
  await page.locator(".sel-bubble .ask textarea").pressSequentially("第二行");
  await page.waitForTimeout(150);
  {
    const stillOpen = (await page.locator(".sel-bubble").count()) === 1;
    const val = await page.locator(".sel-bubble .ask textarea").inputValue();
    assert("Shift+Enter 换行不提交", stillOpen && val.includes("\n"), JSON.stringify(val));
  }

  /* ---- E) 输入中 Esc：关气泡、无消息入树 ---- */
  const rowsBefore = await rowSnap(page);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  {
    const closed = (await page.locator(".sel-bubble").count()) === 0;
    const rows = await rowSnap(page);
    assert("输入中 Esc 关气泡", closed);
    assert("Esc 后列局面不变（无消息入树）", fmtRow(rows) === fmtRow(rowsBefore), fmtRow(rows));
  }

  /* ---- F) ⌘Enter 带问 keepSource：列满时替换来源邻右、来源保留 ----
     此时 3 列 = 主线 + 向量检索 + 图记忆（满，maxExpanded=2）。
     在「向量检索」列（中间）划选带问 ⌘Enter → 来源列保留，邻右「图记忆」被替换。 */
  await selectText(page, "余弦相似度");
  await page.locator(".sel-bubble .ask textarea").fill("为什么只看方向不看长度？");
  await page.keyboard.down("Meta");
  assert("⌘ 按住时文案优先于带问", (await btnLabel(page)) === "在右侧新列打开");
  await page.keyboard.press("Enter");
  await page.keyboard.up("Meta");
  await page.waitForTimeout(600);
  await page.keyboard.press("Escape"); // 余弦相似度可能弹抽屉（无 seed 则无害）
  await page.waitForTimeout(200);
  {
    const rows = await rowSnap(page);
    assert("⌘Enter：仍 3 列", rows.length === 3, fmtRow(rows));
    assert("来源列「向量检索」保留在第 2 列", rows[1].title.includes("向量检索"), fmtRow(rows));
    assert("新列开在来源邻右且标题取锚点", rows[2].title.includes("余弦相似度"), fmtRow(rows));
    const msgs = await colMsgs(page, 2);
    assert("⌘Enter 新列第 1 条 = user 问题", msgs[0]?.role === "user" && msgs[0].text.includes("方向"), JSON.stringify(msgs[0]));
    await page.screenshot({ path: `${DIR}/v6-03-meta-enter.png` });
  }

  /* ---- G) console 干净 ---- */
  assert("全程无 console error", errors.length === 0, errors.join(" | "));

  await browser.close();
  console.log(`\n==== 结果：${passCount} PASS / ${failCount} FAIL ====`);
  process.exit(failCount ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
