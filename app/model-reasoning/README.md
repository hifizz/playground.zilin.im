# Model Reasoning · 推理调节面板

访问 `/model-reasoning`，或从首页 **Agent UX/UI** 分类进入。

`ReasoningPanel` 是受控组件，接收 `value: ReasoningConfig`、`onChange` 和可选的 `disabled`。页面负责配置预览与模拟运行，组件负责模型、推理开关、档位选择。

- Spark 支持 Low / Medium；Think 增加 High；Deep 增加 Max。均为虚构演示模型。
- 切换模型时，超出支持范围的档位自动降至该模型最高档位。
- 关闭 Reasoning 后禁用档位选择，保留档位供再次开启使用；预览省略无效的 effort。
- 模拟使用配置快照，运行期间锁定参数，支持停止、重新运行、恢复默认。卸载时清理定时器。
- 等待时间和预算仅为相对示意，没有真实 API 请求、计费或生成内容。
- 使用原生 select、radio 和 switch 语义；支持键盘操作与减少动态效果偏好。

手工验收：

1. Deep → Max → Spark，确认降至 Medium，High / Max 不可选。
2. 关闭再开启 Reasoning，确认配置预览与档位保留行为。
3. 运行、停止、再次运行、运行时恢复默认，确认无残留进度更新。
4. 用 Tab、方向键、空格操作，检查移动端无横向溢出。
5. 首页 Agent UX/UI 分类能打开新页面。

## 本次验收记录

使用临时 `pnpm@10.30.3` 执行命令，未修改依赖声明或锁文件：

- `pnpm build`：通过，包含 `/model-reasoning` 静态路由。
- `pnpm exec tsc --noEmit`：通过。
- `pnpm exec eslint app/model-reasoning app/_homepage/thumbs/model-reasoning.tsx app/_homepage/demos.tsx`：通过。
- `pnpm lint`：未通过，仓库既有文件合计 56 errors / 15 warnings；本次改动文件无 lint 问题。
- 临时 Playwright 脚本在 Chromium 验证上述 5 组交互，额外检查运行完成、运行时参数锁定、重置后无残留更新、无页面异常、375px 宽度无横向溢出，均通过。

新增页面，无旧版对照图。以下为生产构建截图：

[桌面截图](./screenshots/desktop.png) · [移动端截图](./screenshots/mobile.png)
