/* Thread Chat demo 端到端验证 v5：放置控制——「打开到哪一列」的分层表达。
   覆盖：
   · 迷你列条（micro slot map）：仅主线时不显示；≥1 分支后出现，格数=列数，主线格 disabled；
     hover 小格 title = 会话标题；有空位时幽灵「+」格标注插入位置（⌘ 下随目标迁移）；
   · ⌘/Ctrl keepSource：有空位 → 紧邻来源右侧插入；replace 列满 → 替换来源邻右列，
     来源在最右时替换「除来源外的 LRU」（4 列局面验证 LRU≠最左邻扫）；fold 列满 →
     来源保持展开、新列在其右、折叠严格避开来源；
   · 列条预览 = 提交行为（同一套 placement 规则）：默认目标=来源列；按住 Meta 目标
     实时迁移到邻右格 + 按钮文案切换；松开恢复；
   · override：点小格显式指定让位列（按钮文案带目标标题、提交替换的正是该列、
     再点同格取消、新一次划选自动清空）；
   · 脚注 ⌘+点击（列满）：来源列保留；全程无 console error。
   截图：v5-01 列条默认目标 / v5-02 ⌘ 目标迁移 / v5-03 override / v5-04 fold+⌘。 */
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

/* —— 复用 verify2 的划选辅助（只划选弹气泡，不点按钮）——
   多一步：先把目标文字滚进视口（真实用户只能划选可见文字；分两拍避免
   scroll 事件与气泡定位竞态——scroll 监听会顺带关掉旧气泡，属预期行为）。 */
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
  await page.waitForTimeout(250); // 滚动结算（scroll 监听此时会清掉旧气泡）
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

const openViaPalette = async (page, query) => {
  await page.keyboard.press("Control+k");
  await page.waitForSelector(".swx.global", { timeout: 3000 });
  await page.keyboard.type(query);
  await page.waitForTimeout(250);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);
};

/** 迷你列条快照：DOM 顺序的小格（类名 / title / aria-disabled） */
const mapSnap = (page) =>
  page.$$eval(".sel-bubble .slotmap .smcell", (els) =>
    els.map((el) => ({
      cls: el.className,
      title: el.getAttribute("title") || "",
      disabled: el.getAttribute("aria-disabled") === "true",
    })),
  );
const fmtMap = (m) => m.map((c) => `${c.title || "+"}[${c.cls.replace(/smcell ?/, "")}]`).join(" | ");

/** 列行快照：DOM 顺序的展开列 / 细条（kind + 标题） */
const rowSnap = (page) =>
  page.$$eval(".tc .cols > .column, .tc .cols > .col-strip", (els) =>
    els.map((el) => ({
      kind: el.classList.contains("col-strip") ? "strip" : "col",
      title: (el.querySelector(".ctitle") || el.querySelector(".vt"))?.textContent ?? "",
    })),
  );
const fmtRow = (r) => r.map((c) => `${c.kind === "strip" ? "▍" : ""}${c.title}`).join(" | ");

const btnLabel = (page) => page.locator(".sel-bubble button").innerText();

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("http://localhost:3000/thread-chat", { waitUntil: "networkidle" });

  /* ---- A) 仅主线：气泡不显示迷你列条 ---- */
  await selectText(page, "向量检索");
  assert("仅主线划选：气泡出现但无迷你列条", (await page.locator(".sel-bubble .slotmap").count()) === 0);
  await page.click(".sel-bubble button"); // 普通开分支 → 追加为第一个分支列
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape"); // 收起自动弹出的 Artifact 抽屉
  await page.waitForTimeout(300);
  assert("普通开分支：2 列（主线+向量检索）", (await page.locator(".tc .cols > .column").count()) === 2);

  /* ---- B) 开 1 分支后再划选：列条出现；⌘ 下幽灵格迁移；⌘ 点按钮 = 紧邻来源右侧插入 ---- */
  await selectText(page, "图记忆"); // 在主线划选（有空位：1/2 槽）
  assert("1 分支后划选：迷你列条出现", (await page.locator(".sel-bubble .slotmap").count()) === 1);
  let m = await mapSnap(page);
  let real = m.filter((c) => !c.cls.includes("ghost"));
  assert("列条格数 = 列数（主线+1 分支 = 2）", real.length === 2, fmtMap(m));
  assert("主线格 disabled（锚定不可选）", real[0].cls.includes("main") && real[0].disabled, fmtMap(m));
  assert("hover 小格 title = 会话标题（向量检索）", real[1].title === "向量检索", real[1].title);
  assert(
    "有空位默认：幽灵「+」格在末尾（追加到最右）",
    m.length === 3 && m[2].cls.includes("ghost"),
    fmtMap(m),
  );
  assert("默认按钮文案 = 开启分支讨论", (await btnLabel(page)).includes("开启分支讨论"));
  await page.keyboard.down("Meta");
  await page.waitForTimeout(120);
  m = await mapSnap(page);
  assert(
    "按住 ⌘（来源=主线）：幽灵格迁移到主线右侧第一位",
    m.length === 3 && m[1].cls.includes("ghost") && m[2].title === "向量检索",
    fmtMap(m),
  );
  assert("按住 ⌘：按钮文案 → 在右侧新列打开", (await btnLabel(page)).includes("在右侧新列打开"));
  await page.keyboard.up("Meta");
  await page.waitForTimeout(120);
  m = await mapSnap(page);
  assert("松开 ⌘：幽灵格回到末尾、文案恢复",
    m[2].cls.includes("ghost") && (await btnLabel(page)).includes("开启分支讨论"), fmtMap(m));
  await page.click(".sel-bubble button", { modifiers: ["Meta"] }); // ⌘ 开分支
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape"); // 收起图记忆的 Artifact 抽屉
  await page.waitForTimeout(300);
  let r = await rowSnap(page);
  assert(
    "有空位 + ⌘：新列紧邻来源（主线）右侧插入，来源与既有列保留",
    r.length === 3 && r[1].title === "图记忆" && r[2].title === "向量检索",
    fmtRow(r),
  );

  /* ---- C) 列满（3 列）：列条默认目标 = 来源列；⌘ 下目标迁移到邻右；⌘ 提交替换邻右 ---- */
  await selectText(page, "知识图谱"); // 在中间列「图记忆」里划选（列满 2/2）
  m = await mapSnap(page);
  real = m.filter((c) => !c.cls.includes("ghost"));
  assert("列满划选：格数 = 列数（3），无幽灵格", real.length === 3 && m.length === 3, fmtMap(m));
  assert(
    "列满默认目标 = 来源列（图记忆格有「将替换」样式）",
    m[1].title === "图记忆" && m[1].cls.includes("will-replace") && m[1].cls.includes("src"),
    fmtMap(m),
  );
  await page.screenshot({ path: DIR + "/v5-01-slotmap-default.png" });
  await page.keyboard.down("Meta");
  await page.waitForTimeout(120);
  m = await mapSnap(page);
  assert(
    "按住 ⌘：目标迁移到来源邻右格（向量检索），来源格不再标将替换",
    m[2].title === "向量检索" && m[2].cls.includes("will-replace") && !m[1].cls.includes("will-replace"),
    fmtMap(m),
  );
  assert("按住 ⌘：按钮文案切换为在右侧新列打开", (await btnLabel(page)).includes("在右侧新列打开"));
  await page.screenshot({ path: DIR + "/v5-02-slotmap-meta.png" });
  await page.keyboard.up("Meta");
  await page.waitForTimeout(120);
  m = await mapSnap(page);
  assert(
    "松开 ⌘：目标回到来源列、文案恢复",
    m[1].cls.includes("will-replace") && !m[2].cls.includes("will-replace") &&
      (await btnLabel(page)).includes("开启分支讨论"),
    fmtMap(m),
  );
  await page.click(".sel-bubble button", { modifiers: ["Meta"] });
  await page.waitForTimeout(500);
  let toast = await page.locator(".toast").innerText();
  console.log("  toast:", toast.replace(/\n/g, " "));
  assert("列满中间列 + ⌘：toast 提示替换了邻右列「向量检索」", /替换/.test(toast) && toast.includes("向量检索"));
  r = await rowSnap(page);
  assert(
    "列满中间列 + ⌘：来源保留、邻右被新列顶替",
    r.length === 3 && r[1].title === "图记忆" && r[2].title === "知识图谱",
    fmtRow(r),
  );

  /* ---- D) 列满在最右列划选 + ⌘：替换「除来源外的 LRU」（2 槽局面） ---- */
  await selectText(page, "继续追问"); // 在最右列「知识图谱」里划选
  await page.click(".sel-bubble button", { modifiers: ["Meta"] });
  await page.waitForTimeout(500);
  toast = await page.locator(".toast").innerText();
  r = await rowSnap(page);
  assert(
    "列满最右列 + ⌘：来源（知识图谱）保留，替换除来源外的 LRU（图记忆）",
    toast.includes("图记忆") && r[1].title === "继续追问" && r[2].title === "知识图谱",
    fmtRow(r) + " · " + toast.replace(/\n/g, " "),
  );

  /* ---- E) 4 列局面：最右列 + ⌘ 替换的是真 LRU（中间格），而非最左邻扫 ---- */
  await page.click('.seg button:has-text("4")'); // 强制 4 列 → 空位 1
  await page.waitForTimeout(300);
  await openViaPalette(page, "向量"); // 追加 向量检索 → 列满 [继续追问, 知识图谱, 向量检索]
  await openViaPalette(page, "追问"); // 触摸 继续追问 → LRU 变为中间的 知识图谱
  await selectText(page, "余弦相似度"); // 在最右列「向量检索」里划选
  await page.keyboard.down("Meta");
  await page.waitForTimeout(120);
  m = await mapSnap(page);
  assert(
    "4 列最右 + ⌘ 预览：目标 = 除来源外的 LRU（中间格知识图谱）",
    m[2].title === "知识图谱" && m[2].cls.includes("will-replace"),
    fmtMap(m),
  );
  await page.keyboard.up("Meta");
  await page.click(".sel-bubble button", { modifiers: ["Meta"] });
  await page.waitForTimeout(500);
  toast = await page.locator(".toast").innerText();
  r = await rowSnap(page);
  assert(
    "4 列最右 + ⌘ 提交：替换的正是 LRU 知识图谱（预览=行为），来源保留在最右",
    toast.includes("知识图谱") &&
      r.length === 4 && r[1].title === "继续追问" && r[2].title === "余弦相似度" && r[3].title === "向量检索",
    fmtRow(r) + " · " + toast.replace(/\n/g, " "),
  );

  /* ---- F) override：点小格显式指定让位列 ---- */
  await selectText(page, "上下文腐烂"); // 在主线划选（列满 3/3，来源=主线）
  m = await mapSnap(page);
  assert(
    "override 前：默认目标 = LRU（向量检索，来源主线不在槽内）",
    m[3].title === "向量检索" && m[3].cls.includes("will-replace"),
    fmtMap(m),
  );
  await page.locator('.sel-bubble .smcell[title="余弦相似度"]').click(); // 点选另一格
  await page.waitForTimeout(120);
  m = await mapSnap(page);
  assert(
    "点小格 override：该格高亮为将替换 + override 态",
    m[2].title === "余弦相似度" && m[2].cls.includes("will-replace") && m[2].cls.includes("ov"),
    fmtMap(m),
  );
  assert("override 按钮文案含目标标题", (await btnLabel(page)).includes("开启并替换『余弦相似度』"));
  await page.screenshot({ path: DIR + "/v5-03-slotmap-override.png" });
  await page.locator('.sel-bubble .smcell[title="余弦相似度"]').click(); // 再点同格取消
  await page.waitForTimeout(120);
  m = await mapSnap(page);
  assert(
    "再点同格取消：回默认目标（向量检索）、文案恢复",
    m[3].cls.includes("will-replace") && !m[2].cls.includes("ov") &&
      (await btnLabel(page)).includes("开启分支讨论"),
    fmtMap(m),
  );
  await page.locator('.sel-bubble .smcell[title="余弦相似度"]').click(); // 重新 override
  await page.waitForTimeout(120);
  await page.click(".sel-bubble button"); // 普通点击提交（override 生效）
  await page.waitForTimeout(500);
  toast = await page.locator(".toast").innerText();
  r = await rowSnap(page);
  assert(
    "override 提交：被替换的正是点选的「余弦相似度」",
    toast.includes("余弦相似度") && r[2].title === "上下文腐烂" &&
      r[1].title === "继续追问" && r[3].title === "向量检索",
    fmtRow(r) + " · " + toast.replace(/\n/g, " "),
  );
  await selectText(page, "有效注意力"); // 再次划选
  assert("再次划选：override 已清空", (await page.locator(".sel-bubble .smcell.ov").count()) === 0);
  await page.keyboard.press("Escape"); // 关掉气泡
  await page.waitForTimeout(200);

  /* ---- G) 脚注 ⌘+点击（列满）：来源列保留 ---- */
  const vecCol = page
    .locator(".tc .cols > .column")
    .filter({ has: page.locator(".ctitle", { hasText: "向量检索" }) });
  await vecCol.locator("sup.fnote").first().click({ modifiers: ["Meta"] }); // 打开已关闭的余弦相似度
  await page.waitForTimeout(600);
  toast = await page.locator(".toast").innerText();
  r = await rowSnap(page);
  assert(
    "脚注 ⌘+点击（列满）：来源列（向量检索）保留，余弦相似度打开，替换除来源外 LRU（继续追问）",
    toast.includes("继续追问") && r[1].title === "余弦相似度" &&
      r[2].title === "上下文腐烂" && r[3].title === "向量检索",
    fmtRow(r) + " · " + toast.replace(/\n/g, " "),
  );

  /* ---- H) fold⑤ 模式列满 + ⌘：来源不折叠、新列在其右、折叠避开来源 ---- */
  await page.click('.seg button:has-text("细条⑤")');
  await page.waitForTimeout(300);
  await selectText(page, "lost in the middle"); // 在中间列「上下文腐烂」里划选（列满 3/3）
  m = await mapSnap(page);
  assert(
    "fold 列满默认预览：幽灵格在末尾、将折叠 LRU（向量检索）",
    m.length === 5 && m[4].cls.includes("ghost") && m[3].title === "向量检索" && m[3].cls.includes("will-fold"),
    fmtMap(m),
  );
  await page.keyboard.down("Meta");
  await page.waitForTimeout(120);
  m = await mapSnap(page);
  assert(
    "fold + ⌘ 预览：幽灵格迁移到来源邻右，折叠目标仍避开来源",
    m[2].title === "上下文腐烂" && m[3].cls.includes("ghost") &&
      m[4].title === "向量检索" && m[4].cls.includes("will-fold"),
    fmtMap(m),
  );
  await page.screenshot({ path: DIR + "/v5-04-fold-meta.png" });
  await page.keyboard.up("Meta");
  await page.click(".sel-bubble button", { modifiers: ["Meta"] });
  await page.waitForTimeout(500);
  toast = await page.locator(".toast").innerText();
  r = await rowSnap(page);
  assert("fold + ⌘：toast 提示折叠", /折叠/.test(toast), toast.replace(/\n/g, " "));
  assert(
    "fold + ⌘：来源列未被折叠（仍展开）、新列紧邻其右、被折的是非来源列",
    r.length === 5 &&
      r[2].kind === "col" && r[2].title === "上下文腐烂" &&
      r[3].kind === "col" && r[3].title.startsWith("lost in the m") &&
      r[4].kind === "strip" && r[4].title === "向量检索",
    fmtRow(r),
  );

  /* ---- 收尾 ---- */
  assert("全程无 console error", errors.length === 0, errors.slice(0, 3).join(" ; "));

  console.log(`\n==== 结果：${passCount} PASS / ${failCount} FAIL ====`);
  await browser.close();
  if (failCount > 0) process.exit(1);
})().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
