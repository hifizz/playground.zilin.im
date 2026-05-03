# playground.zilin.im

AI 时代的 UI/UX 实验室。收录各类交互 Demo，研究 UI Agent 所需的 UI/UX 效果。

## 添加新 Demo

1. 在 `app/<demo-name>/page.tsx` 写好 Demo 页面。
2. 在 `app/_homepage/thumbs/<demo-name>.tsx` 创建缩略图组件（导出一个同名函数，纯展示，无 state）。
3. 在 `app/_homepage/demos.tsx` 的 `demos` 数组末尾追加一条记录：

```ts
{
  title: "...",
  description: "...",     // 一句话说明核心交互
  route: "/<demo-name>",
  category: "Interaction" | "Explored Demo" | "Agent UX/UI",
  tags: ["..."],
  preview: <XxxThumb />,  // 引入上面创建的缩略图
}
```

缩略图约定：固定尺寸容器（`w-full h-full`），用 inline style 写渐变背景 + 抽象 SVG/div 图形，暗示 Demo 的核心交互，不依赖截图。参考已有文件风格。

## 项目结构

```
app/
├── page.tsx                     # 2 行，re-export _homepage
├── _homepage/
│   ├── index.tsx                # 页面外壳
│   ├── hero.tsx                 # Hero 区域
│   ├── demos-grid.tsx           # 分类 Tab + Grid（use client）
│   ├── demo-card.tsx            # 单张卡片
│   ├── demos.tsx                # DemoEntry 类型 + demos 数组
│   └── thumbs/                  # 每个 Demo 一个缩略图文件
└── <demo-name>/
    └── page.tsx
```
