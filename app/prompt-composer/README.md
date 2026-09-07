# Prompt Composer

迁移自 [Beautiful UI 的 Prompt Bar](https://www.beautifului.dev/#prompt-bar)，使用用户提供的 TSX 与上游 globals.css 设计参数。原作 © 2026 Shane Levine，MIT 许可见 LICENSE.beautiful-ui。

- 路由：`/prompt-composer`，首页 Agent UX/UI 分类。
- `prompt-bar.tsx` 为可复用组件；`demo={false}` 关闭自动演示，`variant="Pill"` 使用胶囊，`tall` 使用多行布局，`onSend` 接收文本。
- 原版模拟附件、转写、连接和模型选择保留；不上传文件、不录音、不调用模型。
- 样式局部隔离；阴影参数取自原站 shadow-plugin 的计算值，彩虹动画使用 glimm。
- 迁移时增加中文输入法保护、点击外部关闭输入触发的菜单、发送时取消待完成模拟转写，以及减少动态效果偏好的支持。

验证：新增文件 ESLint 与独立 TypeScript 检查；ego-browser 验证 @ 过滤选择、/ 命令选择、发送反馈、模型选择、模拟转写、附件增删、深色与手机布局。全站构建受现有 shanghai-station-map/src/main.ts 的 TypeScript 错误阻断，全站 lint 另有既有错误。
