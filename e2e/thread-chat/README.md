# Thread Chat E2E 套件

纯 Node + [playwright-core](https://www.npmjs.com/package/playwright-core) 断言脚本（无测试框架依赖），共 185 条断言，覆盖矩阵见 `app/thread-chat/README.md` §9。

## 运行

```bash
# 1) 依赖（任选其一装到本目录或全局；仓库主依赖里刻意不含 playwright）
npm i --no-save playwright-core

# 2) 构建并启动被测应用（脚本固定访问 http://localhost:3000/thread-chat）
pnpm build && pnpm start &

# 3) 逐套运行（顺序无依赖，各自独立开浏览器）
node e2e/thread-chat/verify2.js   # 核心回归 · 40 断言
node e2e/thread-chat/verify3.js   # 列宽体系 · 42 断言
node e2e/thread-chat/verify4.js   # 画布模式 · 31 断言
node e2e/thread-chat/verify5.js   # 放置控制 · 34 断言
node e2e/thread-chat/verify6.js   # 气泡输入框 · 22 断言
node e2e/thread-chat/verify7.js   # 流式内核 · 16 断言
```

- **Chromium 路径**：默认 `/opt/pw-browsers/chromium`，本机运行请设 `CHROMIUM_PATH=/path/to/chrome`（任何 Chromium 系浏览器可执行文件均可）。
- 每套脚本自行输出逐条 `PASS/FAIL` 与汇总；任何 FAIL 时进程退出码非 0。
- 运行会在本目录产生调试截图（`*.png`，已 gitignore）。

## 约定

verify2/3/4 是**回归契约**：加新功能时不许修改它们（在旁边加新套件验收新行为）；只有行为语义变更才允许改对应套件，并在 commit message 里说明改了什么、为什么。
