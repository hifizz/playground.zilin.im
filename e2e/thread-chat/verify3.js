/* Thread Chat demo 端到端验证 v3（fill + lane 语义版）：
   列行永远铺满视口（无 gutter）+ 列宽上限移除（由邻列 min + 容器决定）+
   列内 .lane 阅读通道（--lane-max 760 居中）。

   覆盖：
   · 单主线列铺满视口；.lane ≤760 列内居中；col-head 标题与消息 lane 左缘对齐；
   · 3 列（1440px）：resizer=2；右拖 160 零和 ±160；行总宽==容器（无 gutter）；
   · 拖拽上限新语义：右邻列停在 min 340，左列可 >760（1600px 下拖满）；
   · 双击恢复均分（整行）+ 键盘 ←/→ ±24 零和；
   · 细条⑤：细条旁无 resizer；细条 + 定宽列共存仍铺满无 gutter；
   · 列满替换继承槽位宽度（flex-basis 条目随槽转移）；
   · 1440 → 2200 resize：无 gutter、显式宽列参与吸收、宽列 lane 居中；
   · 900px 窄屏（强制 4 列）：横向滚动仍可达最左列。

   备注：1440px 三列均分 = 480px/列，右邻列距 min(340) 只有 140px 余量，
   直接右拖 160 会被零和 clamp 截断；因此先把第二条分割线右拖 120 给右邻
   列留出空间，再做「拖 160 ≈ 变化 160」的主断言。 */
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

/** 展开列快照：DOM 顺序的 { id, title, w }（不含细条 / 分割线） */
const colSnap = (page) =>
  page.$$eval(".tc .cols > .column", (els) =>
    els.map((el) => ({
      id: el.dataset.threadId,
      title: el.querySelector(".ctitle")?.textContent ?? "",
      w: el.getBoundingClientRect().width,
    })),
  );

/** 行填充度：容器盒 + 首末渲染单元（列/细条）到容器两缘的空隙 */
const rowFill = (page) =>
  page.$eval(".tc .cols", (cols) => {
    const items = [...cols.querySelectorAll(":scope > .column, :scope > .col-strip")];
    const r = cols.getBoundingClientRect();
    const first = items[0]?.getBoundingClientRect();
    const last = items[items.length - 1]?.getBoundingClientRect();
    return {
      gapL: first ? first.left - r.left : NaN,
      gapR: last ? r.right - last.right : NaN,
      clientWidth: cols.clientWidth,
      scrollWidth: cols.scrollWidth,
    };
  });

/** 无 gutter 断言（无横向溢出时首末列贴容器两缘，容差 1px） */
const assertNoGutter = async (page, label) => {
  const f = await rowFill(page);
  assert(
    label,
    near(f.gapL, 0, 1) && near(f.gapR, 0, 1) && f.scrollWidth <= f.clientWidth + 1,
    `gapL=${f.gapL.toFixed(1)}, gapR=${f.gapR.toFixed(1)}, scroll=${f.scrollWidth}/${f.clientWidth}`,
  );
};

/** 某列的 lane 布局度量：消息 lane 宽 / 列内居中留白 / 列头 lane 左缘 */
const laneMetrics = (page, colSel) =>
  page.$eval(colSel, (col) => {
    const cr = col.getBoundingClientRect();
    const lane = col.querySelector(".msg-list > .lane");
    const head = col.querySelector(".col-head > .lane");
    const lr = lane.getBoundingClientRect();
    return {
      colW: cr.width,
      laneW: lr.width,
      gapL: lr.left - cr.left,
      gapR: cr.right - lr.right,
      laneLeft: lr.left,
      headLaneLeft: head ? head.getBoundingClientRect().left : NaN,
    };
  });

/** 拖第 index 条分割线：水平位移 dx（分步 move，走 pointer capture + rAF 合帧路径） */
const dragResizer = async (page, index, dx) => {
  const box = await page.locator(".col-resizer").nth(index).boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx, cy, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(150); // commit → React 重渲 + inline 清理落定
};

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("http://localhost:3000/thread-chat", { waitUntil: "networkidle" });

  /* ---- 0) 单主线列：铺满视口 + lane 阅读通道居中 ---- */
  let snap = await colSnap(page);
  let fill = await rowFill(page);
  assert("单主线列：仅 1 列", snap.length === 1);
  assert(
    "单主线列：列宽 == 视口宽（铺满，无 760 封顶）",
    near(snap[0].w, fill.clientWidth, 1) && snap[0].w > 1400,
    `col=${snap[0].w.toFixed(1)}, cols=${fill.clientWidth}`,
  );
  await assertNoGutter(page, "单主线列：无 gutter");
  let lm = await laneMetrics(page, '.column[data-thread-id="main"]');
  assert("单主线列：消息 lane 宽 ≤760", lm.laneW <= 761, `laneW=${lm.laneW.toFixed(1)}`);
  assert(
    "单主线列：lane 列内水平居中（左右留白差 <10px）",
    lm.gapL > 100 && Math.abs(lm.gapL - lm.gapR) < 10,
    `gapL=${lm.gapL.toFixed(1)}, gapR=${lm.gapR.toFixed(1)}`,
  );
  assert(
    "单主线列：col-head 标题内容与消息 lane 左缘对齐（±2px）",
    near(lm.headLaneLeft, lm.laneLeft, 2),
    `head=${lm.headLaneLeft.toFixed(1)}, msg=${lm.laneLeft.toFixed(1)}`,
  );
  await page.screenshot({ path: DIR + "/v3-01-single-fill-lane.png" });

  /* ---- 1) 开 2 个分支 → 3 列；resizer=2；无 gutter ---- */
  await selectAndFork(page, "向量检索");
  await page.keyboard.press("Escape"); // 收起自动弹出的 Artifact 抽屉
  await page.waitForTimeout(300);
  await selectAndFork(page, "图记忆");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  snap = await colSnap(page);
  assert("三列：主线 + 2 分支", snap.length === 3, snap.map((c) => c.title).join("|"));
  assert("三列：相邻展开列间共 2 条分割线", (await page.locator(".col-resizer").count()) === 2);
  await assertNoGutter(page, "三列：无 gutter");

  /* ---- 2) 主拖拽：右拖 160 零和 ±160，行总宽==容器 ---- */
  await dragResizer(page, 1, 120); // 预拉宽（见文件头备注）：b1 480→600、b2 480→360
  snap = await colSnap(page);
  assert("预备拖拽：第二列拉宽到 ≈600", near(snap[1].w, 600, 10), `w=${snap[1].w.toFixed(1)}`);

  const before = await colSnap(page);
  await dragResizer(page, 0, 160);
  const after = await colSnap(page);
  assert(
    "拖拽 160px：主线列宽 +≈160",
    near(after[0].w - before[0].w, 160, 10),
    `${before[0].w.toFixed(1)} -> ${after[0].w.toFixed(1)}`,
  );
  assert(
    "拖拽 160px：右邻列宽 -≈160（零和）",
    near(before[1].w - after[1].w, 160, 10),
    `${before[1].w.toFixed(1)} -> ${after[1].w.toFixed(1)}`,
  );
  assert(
    "拖拽 160px：第三列宽不变（commit 无跳动）",
    near(after[2].w, before[2].w, 2),
    `${before[2].w.toFixed(1)} -> ${after[2].w.toFixed(1)}`,
  );
  await assertNoGutter(page, "拖拽后：行总宽==容器（无 gutter）");

  /* ---- 3) 拖拽上限新语义：1600px 下拖满 → 右邻停 min 340，左列 >760 ---- */
  await page.setViewportSize({ width: 1600, height: 860 });
  await page.waitForTimeout(500); // 显式宽列一起吸收 +160
  await assertNoGutter(page, "resize 1600：显式宽列吸收差值，无 gutter");
  await dragResizer(page, 0, 900); // 远超可行区间 → 截断到右邻 min
  snap = await colSnap(page);
  assert("上限新语义：右邻列停在 min ≈340", near(snap[1].w, 340, 2), `w=${snap[1].w.toFixed(1)}`);
  assert("上限新语义：左列可超过 760", snap[0].w > 760, `main=${snap[0].w.toFixed(1)}`);
  await assertNoGutter(page, "上限新语义：拖满后仍无 gutter");
  await page.screenshot({ path: DIR + "/v3-03-over-760.png" });

  /* ---- 4) 双击恢复均分（整行回自动均分，CSS 过渡） ---- */
  await page.locator(".col-resizer").first().dblclick();
  await page.waitForTimeout(700); // 0.32s CSS 过渡 + 清理落定
  snap = await colSnap(page);
  const even = snap.reduce((s, c) => s + c.w, 0) / snap.length;
  assert(
    "双击恢复：整行回到均分",
    snap.every((c) => near(c.w, even, 10)),
    snap.map((c) => c.w.toFixed(1)).join(" | ") + `（期望各 ≈${even.toFixed(1)}）`,
  );
  await assertNoGutter(page, "双击恢复后：无 gutter");

  /* ---- 5) 键盘：聚焦分割线 ArrowRight × 3 ≈ +72px（零和） ---- */
  const kbBefore = await colSnap(page);
  await page.locator(".col-resizer").first().focus();
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(90);
  }
  snap = await colSnap(page);
  assert(
    "键盘 →×3：主线列宽 +≈72",
    near(snap[0].w - kbBefore[0].w, 72, 10),
    `${kbBefore[0].w.toFixed(1)} -> ${snap[0].w.toFixed(1)}`,
  );
  assert(
    "键盘 →×3：右邻列宽 -≈72（零和）",
    near(kbBefore[1].w - snap[1].w, 72, 10),
    `${kbBefore[1].w.toFixed(1)} -> ${snap[1].w.toFixed(1)}`,
  );
  await assertNoGutter(page, "键盘步进后：无 gutter");

  /* ---- 6) 细条⑤：细条旁无分割线；细条 + 定宽列共存仍铺满 ---- */
  await page.click('.seg button:has-text("细条⑤")');
  await page.waitForTimeout(200);
  await selectAndFork(page, "上下文腐烂"); // 追加第 3 分支 → LRU「向量检索」折为细条
  await page.keyboard.press("Escape"); // 收起随分支弹出的抽屉
  await page.waitForTimeout(300);
  const stripCount = await page.locator(".col-strip").count();
  const rzCount = await page.locator(".col-resizer").count();
  const stripNeighbors = await page.$$eval(".tc .cols .col-strip", (strips) =>
    strips.map((s) => ({
      prev: s.previousElementSibling?.className ?? "",
      next: s.nextElementSibling?.className ?? "",
    })),
  );
  assert("细条⑤：出现 1 条细条", stripCount === 1);
  assert("细条⑤：分割线只剩展开列之间的 1 条", rzCount === 1, `resizers=${rzCount}`);
  assert(
    "细条⑤：细条两侧均无分割线",
    stripNeighbors.every((n) => !n.prev.includes("col-resizer") && !n.next.includes("col-resizer")),
    JSON.stringify(stripNeighbors),
  );
  await assertNoGutter(page, "细条⑤：细条 + 定宽列共存仍铺满无 gutter");
  await page.screenshot({ path: DIR + "/v3-06-fold-strip.png" });

  /* ---- 7) 列满替换：新列继承被替换列的显式宽度（flex-basis 条目随槽转移） ---- */
  await page.click('.seg button:has-text("替换⑥")'); // 细条展开、最左「向量检索」被裁掉
  await page.waitForTimeout(500);
  const preWiden = await colSnap(page);
  await dragResizer(page, 0, -120); // 左拖第一条分割线：中间列拖宽 +120（右邻已在 min，只能向左要空间）
  snap = await colSnap(page);
  const widenedW = snap[1].w;
  const widenedTitle = snap[1].title;
  assert(
    "替换前置：中间列已拖宽 +≈120",
    near(widenedW - preWiden[1].w, 120, 10),
    `${widenedTitle} ${preWiden[1].w.toFixed(1)} -> ${widenedW.toFixed(1)}`,
  );
  await openViaPalette(page, "向量"); // 列满 → 替换 LRU（正是刚拖宽的中间列）
  snap = await colSnap(page);
  const inherited = snap.find((c) => c.title.includes("向量检索"));
  assert(
    "列满替换：新列出现在原槽位并继承其宽度（flex-basis 随槽转移）",
    !!inherited && snap[1] === inherited && near(inherited.w, widenedW, 10),
    snap.map((c) => `${c.title}:${c.w.toFixed(1)}`).join(" | "),
  );
  await assertNoGutter(page, "列满替换后：无 gutter");

  /* ---- 8) 窗口 1440 → 2200：无 gutter、显式宽列按比例参与吸收 ---- */
  await page.setViewportSize({ width: 1440, height: 860 });
  await page.waitForTimeout(500);
  const preResize = await colSnap(page);
  await page.setViewportSize({ width: 2200, height: 860 });
  await page.waitForTimeout(600);
  snap = await colSnap(page);
  assert(
    "resize 2200：三列全部变宽（显式宽列参与吸收，不产生空隙）",
    snap.length === 3 && snap.every((c, i) => c.w > preResize[i].w + 10),
    snap.map((c, i) => `${preResize[i].w.toFixed(0)}->${c.w.toFixed(0)}`).join(" | "),
  );
  await assertNoGutter(page, "resize 2200：无 gutter");

  // 拖宽主线列到 >796，验证宽列内 lane 通道居中（并留验收截图）
  await dragResizer(page, 0, 300);
  snap = await colSnap(page);
  assert("宽屏拖宽：主线列 >796（lane 开始居中）", snap[0].w > 796, `w=${snap[0].w.toFixed(1)}`);
  lm = await laneMetrics(page, '.column[data-thread-id="main"]');
  assert(
    "宽屏宽列：消息 lane 宽 ==760 且列内居中",
    near(lm.laneW, 760, 1) && Math.abs(lm.gapL - lm.gapR) < 10,
    `laneW=${lm.laneW.toFixed(1)}, gapL=${lm.gapL.toFixed(1)}, gapR=${lm.gapR.toFixed(1)}`,
  );
  assert(
    "宽屏宽列：col-head 标题与消息 lane 左缘对齐（±2px）",
    near(lm.headLaneLeft, lm.laneLeft, 2),
    `head=${lm.headLaneLeft.toFixed(1)}, msg=${lm.laneLeft.toFixed(1)}`,
  );
  await assertNoGutter(page, "宽屏拖宽后：无 gutter");

  // 分支列的 banner 通道（.lane.pad）：窄列 18px 侧距不变；宽列与消息 lane 左缘对齐
  const bannerBox = (sel) =>
    page.$eval(sel, (col) => {
      const cr = col.getBoundingClientRect();
      const br = col.querySelector(".focus-banner").getBoundingClientRect();
      const mr = col.querySelector(".msg-list > .lane").getBoundingClientRect();
      return { inset: br.left - cr.left, bannerLeft: br.left, laneLeft: mr.left, colW: cr.width };
    });
  let bb = await bannerBox(".tc .cols > .column.branch:last-of-type"); // 末列（< 通道宽）
  assert(
    "窄分支列（<796）：banner 侧距保持 18px（观感与旧版一致）",
    bb.colW < 796 && near(bb.inset, 18, 1),
    `colW=${bb.colW.toFixed(1)}, inset=${bb.inset.toFixed(1)}`,
  );
  await dragResizer(page, 1, 250); // 把第二列（分支）也拖到 >796，触发 banner 通道居中
  bb = await bannerBox(".tc .cols > .column.branch"); // 首个分支列（向量检索）
  assert(
    "宽分支列：banner 通道居中且与消息 lane 左缘对齐（±2px）",
    bb.colW > 796 && near(bb.bannerLeft, bb.laneLeft, 2),
    `colW=${bb.colW.toFixed(1)}, banner=${bb.bannerLeft.toFixed(1)}, lane=${bb.laneLeft.toFixed(1)}`,
  );
  await assertNoGutter(page, "宽分支列拖宽后：无 gutter");
  await page.screenshot({ path: DIR + "/v3-08-wide-2200-lane.png" });

  /* ---- 9) 900px 窄屏（强制 4 列保住 3 列）：横向滚动仍可达最左列 ---- */
  await page.click('.seg button:has-text("4")'); // 固定列数，避免窄屏自动裁列
  await page.waitForTimeout(200);
  await page.setViewportSize({ width: 900, height: 860 });
  await page.waitForTimeout(600);
  snap = await colSnap(page);
  fill = await rowFill(page);
  assert(
    "900px 窄屏：3 列总 min 超容器 → 横向滚动",
    snap.length === 3 && fill.scrollWidth > fill.clientWidth + 10,
    `cols=${snap.length}, scroll=${fill.scrollWidth}/${fill.clientWidth}`,
  );
  const edges = await page.$eval(".tc .cols", (cols) => {
    cols.scrollLeft = 0;
    const first = cols.querySelector(":scope > .column").getBoundingClientRect();
    const r = cols.getBoundingClientRect();
    return { firstGap: first.left - r.left };
  });
  assert("900px 窄屏：滚动到最左后首列贴容器左缘", near(edges.firstGap, 0, 1), `gap=${edges.firstGap.toFixed(1)}`);
  await page.screenshot({ path: DIR + "/v3-09-narrow-overflow.png" });

  /* ---- 收尾 ---- */
  assert("全程无 console error", errors.length === 0, errors.slice(0, 3).join(" ; "));

  console.log(`\n==== 结果：${passCount} PASS / ${failCount} FAIL ====`);
  await browser.close();
  if (failCount > 0) process.exit(1);
})().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
