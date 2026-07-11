/* Thread Chat demo 端到端验证 v2：
   旧断言（开分支/抽屉/列满替换+撤销/⌘K/⇄/artifact/发消息/窄屏降列/无 console error）
   + 新断言（细条⑤策略：折叠/原地展开/切回⑥；列头子分支按钮 + 子树弹层）。 */
const { chromium } = require("playwright-core");
const DIR = __dirname;

let passCount = 0;
let failCount = 0;
const results = [];
function assert(name, cond, detail = "") {
  const line = `${cond ? "PASS" : "FAIL"}: ${name}${detail ? ` (${detail})` : ""}`;
  results.push(line);
  console.log(line);
  if (cond) passCount++;
  else failCount++;
}

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

const openViaPalette = async (page, query) => {
  await page.keyboard.press("Control+k");
  await page.waitForSelector(".swx.global", { timeout: 3000 });
  await page.keyboard.type(query);
  await page.waitForTimeout(250);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);
};

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("http://localhost:3000/thread-chat", { waitUntil: "networkidle" });
  await page.screenshot({ path: DIR + "/v2-01-initial.png" });
  assert("初始加载：仅主线 1 列", (await page.locator(".column").count()) === 1);

  /* ============ 旧断言（方案⑥默认行为） ============ */

  // 1) 划选「向量检索」开分支 → 新增一列 + Artifact 抽屉自动弹出
  await selectAndFork(page, "向量检索");
  await page.screenshot({ path: DIR + "/v2-02-branch-artifact.png" });
  assert("开分支：列数变为 2", (await page.locator(".column").count()) === 2);
  assert("开分支：Artifact 抽屉自动弹出", (await page.locator(".art-drawer.open").count()) === 1);

  // 2) Esc 收起抽屉，再开「图记忆」→ 3 列满
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  assert("Esc 关闭抽屉", (await page.locator(".art-drawer.open").count()) === 0);
  await selectAndFork(page, "图记忆");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  assert("第二个分支：列数变为 3（1440px 自适应上限）", (await page.locator(".column").count()) === 3);
  await page.screenshot({ path: DIR + "/v2-03-three-cols.png" });

  // 3) 列满再开「上下文腐烂」→ 替换一列 + toast 撤销
  await selectAndFork(page, "上下文腐烂");
  const toastText = await page.locator(".toast").innerText();
  console.log("  toast:", toastText.replace(/\n/g, " "));
  assert("列满替换：toast 提示替换", /替换/.test(toastText));
  assert("列满替换：撤销按钮存在", (await page.locator(".toast .undo").count()) === 1);
  await page.screenshot({ path: DIR + "/v2-04-replace-toast.png" });
  await page.click(".toast .undo");
  await page.waitForTimeout(500);
  const titlesAfterUndo = (await page.locator(".ctitle").allInnerTexts()).join("|");
  assert(
    "撤销后恢复原两列（向量检索 + 图记忆）",
    titlesAfterUndo.includes("向量检索") && titlesAfterUndo.includes("图记忆"),
    titlesAfterUndo,
  );

  // 4) ⌘K 会话树：行数 / 搜索 / 回车打开
  await page.keyboard.press("Control+k");
  await page.waitForSelector(".swx.global", { timeout: 3000 });
  await page.screenshot({ path: DIR + "/v2-05-palette.png" });
  assert("⌘K：会话树行数 = 4（主线+3 分支）", (await page.locator(".swx-row").count()) === 4);
  await page.keyboard.type("腐烂");
  await page.waitForTimeout(250);
  assert("⌘K：搜索「腐烂」过滤到 1 行", (await page.locator(".swx-row").count()) === 1);
  await page.screenshot({ path: DIR + "/v2-06-palette-filter.png" });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);
  const titlesAfterPalette = (await page.locator(".ctitle").allInnerTexts()).join("|");
  assert("⌘K 回车：上下文腐烂 已打开（列满替换 LRU）", titlesAfterPalette.includes("上下文腐烂"), titlesAfterPalette);
  await page.screenshot({ path: DIR + "/v2-07-after-palette.png" });

  // 5) 每列 ⇄ 切换器
  await page.locator(".column.branch .cbtn", { hasText: "切换" }).first().click();
  await page.waitForSelector(".swx.local", { timeout: 3000 });
  await page.screenshot({ path: DIR + "/v2-08-column-switcher.png" });
  const localRows = await page.locator(".swx-row .t").allInnerTexts();
  assert("⇄ 切换器：列出整棵会话树（4 行）", localRows.length === 4, localRows.join("|"));
  assert(
    "⇄ 切换器：标注「本列」状态",
    (await page.locator(".swx-row .st", { hasText: "本列" }).count()) === 1,
  );
  await page.locator(".swx-row").last().click();
  await page.waitForTimeout(500);
  assert("⇄ 点击当前列会话：仅闪烁不变列", (await page.locator(".column").count()) === 3);

  // 6) 顶栏 Artifact → 抽屉标签页 + 定位来源
  await page.locator(".topbar .tbtn", { hasText: "Artifact" }).click();
  await page.waitForTimeout(500);
  const tabs = await page.locator(".art-tab").allInnerTexts();
  assert("抽屉：3 个 artifact 标签页", tabs.length === 3, tabs.join(" | "));
  await page.screenshot({ path: DIR + "/v2-09-drawer.png" });
  await page.locator(".art-tab").nth(1).click();
  await page.waitForTimeout(300);
  await page.locator(".art-src .loc").click();
  await page.waitForTimeout(600);
  const titlesAfterLocate = (await page.locator(".ctitle").allInnerTexts()).join("|");
  assert("定位来源会话：向量检索 被打开", titlesAfterLocate.includes("向量检索"), titlesAfterLocate);
  await page.screenshot({ path: DIR + "/v2-10-locate-source.png" });

  // 7) 分支内发消息（写死回复）
  const msgBefore = await page.locator(".column.branch").first().locator(".message").count();
  await page.locator(".column.branch textarea").first().fill("为什么中间的信息容易被忽略？");
  await page.locator(".column.branch textarea").first().press("Enter");
  await page.waitForTimeout(400);
  const msgAfter = await page.locator(".column.branch").first().locator(".message").count();
  assert("分支发消息：+2 条（用户 + 写死回复）", msgAfter === msgBefore + 2, `${msgBefore} -> ${msgAfter}`);

  // 8) 窄窗口 → 自动降 2 列
  await page.setViewportSize({ width: 900, height: 860 });
  await page.waitForTimeout(600);
  assert("900px 窄屏：自动降为 2 列", (await page.locator(".column").count()) === 2);
  await page.screenshot({ path: DIR + "/v2-11-narrow.png" });

  /* ============ 新断言：方案⑤细条策略 ============ */

  // 9) 恢复宽视口，先 Esc 关掉步骤 6 打开的抽屉，再收起全部分支列，切到「细条⑤」
  await page.setViewportSize({ width: 1440, height: 860 });
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  while ((await page.locator('.column.branch .cbtn:has-text("收起")').count()) > 0) {
    await page.locator('.column.branch .cbtn:has-text("收起")').first().click();
    await page.waitForTimeout(200);
  }
  assert("重置：仅剩主线列", (await page.locator(".column").count()) === 1);
  await page.click('.seg button:has-text("细条⑤")');
  await page.waitForTimeout(200);

  // 10) 填满两个展开位
  await openViaPalette(page, "向量");
  await openViaPalette(page, "图记忆");
  assert("细条⑤：两个分支展开，共 3 列", (await page.locator(".column").count()) === 3);

  // 11) 开第 4 个分支（Memory-as-Tool）→ 追加新列 + LRU 列折叠为细条
  await selectAndFork(page, "Memory-as-Tool");
  const foldToast = await page.locator(".toast").innerText();
  console.log("  toast:", foldToast.replace(/\n/g, " "));
  assert("细条⑤：toast 提示折叠（无需撤销）", /折叠/.test(foldToast) && (await page.locator(".toast .undo").count()) === 0);
  let strips = await page.locator(".col-strip").count();
  let branchCols = await page.locator(".column.branch").count();
  assert("细条⑤：出现 1 条细条", strips === 1);
  assert("细条⑤：列不丢——细条数(1)+展开分支数(2)=槽数(3)", strips === 1 && branchCols === 2, `strips=${strips}, branch=${branchCols}`);
  assert(
    "细条⑤：被折叠的是 LRU 列「向量检索」",
    ((await page.locator(".col-strip .vt").allInnerTexts()).join("")).includes("向量检索"),
  );
  await page.keyboard.press("Escape"); // 收起自动弹出的抽屉
  await page.waitForTimeout(300);
  await page.screenshot({ path: DIR + "/v2-12-fold-strip.png" });

  // 12) 点细条 → 原地展开；超限则再折叠一条 LRU
  await page.click(".col-strip");
  await page.waitForTimeout(500);
  strips = await page.locator(".col-strip").count();
  branchCols = await page.locator(".column.branch").count();
  const titlesAfterExpand = (await page.locator(".ctitle").allInnerTexts()).join("|");
  assert("细条点击：向量检索 原地展开", titlesAfterExpand.includes("向量检索"), titlesAfterExpand);
  assert("细条点击：展开超限 → 再折叠一条 LRU（图记忆）",
    strips === 1 && ((await page.locator(".col-strip .vt").allInnerTexts()).join("")).includes("图记忆"));
  assert("细条点击：槽数守恒 1+2=3", strips === 1 && branchCols === 2, `strips=${strips}, branch=${branchCols}`);
  await page.screenshot({ path: DIR + "/v2-13-strip-expanded.png" });

  /* ============ 新断言：列头「子分支」按钮 + 子树弹层 ============ */

  // 13) 主线列子分支按钮 → 子树弹层（4 个直接子分支）
  const mainTreeBtnText = await page.locator(".column.main .cbtn.tree .n").innerText();
  assert("主线列头：子分支按钮带数量徽章 4", mainTreeBtnText === "4", mainTreeBtnText);
  await page.click(".column.main .cbtn.tree");
  await page.waitForSelector(".swx.subtree", { timeout: 3000 });
  const subtreeTitle = await page.locator(".swx-title").innerText();
  assert("子树弹层：面板头为『主线』的子分支", subtreeTitle.includes("主线") && subtreeTitle.includes("子分支"), subtreeTitle);
  const subtreeRowCount = await page.locator(".swx.subtree .swx-row").count();
  assert("子树弹层：行数 = 4（主线整棵子树）", subtreeRowCount === 4);
  assert(
    "子树弹层：行内标注 第N列 / 细条 状态",
    (await page.locator(".swx.subtree .swx-row .st").count()) >= 2,
  );
  await page.screenshot({ path: DIR + "/v2-14-subtree-main.png" });

  // 点击「上下文腐烂」行 → 列满走当前策略（细条⑤：追加 + 折叠 LRU）
  await page.locator(".swx.subtree .swx-row", { hasText: "上下文腐烂" }).click();
  await page.waitForTimeout(600);
  strips = await page.locator(".col-strip").count();
  branchCols = await page.locator(".column.branch").count();
  assert(
    "子树行点击：上下文腐烂 打开，细条累积（2 条细条 + 2 展开 = 4 槽）",
    strips === 2 && branchCols === 2 &&
      ((await page.locator(".ctitle").allInnerTexts()).join("|")).includes("上下文腐烂"),
    `strips=${strips}, branch=${branchCols}`,
  );
  await page.screenshot({ path: DIR + "/v2-15-subtree-opened.png" });

  // 14) 空态：叶子分支列的子树弹层
  await page.locator(".column.branch .cbtn.tree").first().click();
  await page.waitForSelector(".swx.subtree", { timeout: 3000 });
  const emptyText = await page.locator(".swx-empty").innerText();
  assert(
    "子树空态文案：还没有子分支——划选开出第一个",
    emptyText.includes("还没有子分支") && emptyText.includes("划选"),
    emptyText,
  );
  await page.screenshot({ path: DIR + "/v2-16-subtree-empty.png" });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  assert("Esc 关闭子树弹层", (await page.locator(".swx").count()) === 0);

  /* ============ 新断言：切回替换⑥ ============ */

  // 15) fold → replace：细条全部展开后从左裁掉超限列
  await page.click('.seg button:has-text("替换⑥")');
  await page.waitForTimeout(500);
  strips = await page.locator(".col-strip").count();
  branchCols = await page.locator(".column.branch").count();
  const backToast = await page.locator(".toast").innerText();
  console.log("  toast:", backToast.replace(/\n/g, " "));
  assert("切回⑥：细条清零", strips === 0);
  assert("切回⑥：展开列收敛到上限（2 个分支列）", branchCols === 2, `branch=${branchCols}`);
  assert("切回⑥：toast 说明超限列已收起", /切回替换/.test(backToast) && /收起/.test(backToast));
  await page.screenshot({ path: DIR + "/v2-17-back-replace.png" });

  // 16) 替换⑥仍正常：⌘K 打开不可见分支 → 替换 + 撤销
  await openViaPalette(page, "向量");
  const replaceToast2 = await page.locator(".toast").innerText();
  assert("切回⑥后：列满替换 + 撤销按钮", /替换/.test(replaceToast2) && (await page.locator(".toast .undo").count()) === 1);
  await page.click(".toast .undo");
  await page.waitForTimeout(400);
  assert("切回⑥后：撤销恢复原列", !((await page.locator(".ctitle").allInnerTexts()).join("|")).includes("向量检索"));
  await page.screenshot({ path: DIR + "/v2-18-replace-undo.png" });

  /* ============ 收尾 ============ */
  assert("全程无 console error", errors.length === 0, errors.slice(0, 3).join(" ; "));

  console.log(`\n==== 结果：${passCount} PASS / ${failCount} FAIL ====`);
  await browser.close();
  if (failCount > 0) process.exit(1);
})().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
