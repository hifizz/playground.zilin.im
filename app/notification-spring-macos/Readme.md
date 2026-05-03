# Notification Liquid Glass Demo

一个使用 **React**、**Tailwind CSS** 和 **Framer Motion** 构建的、受 macOS 通知样式启发的通知堆叠演示项目。

这个 Demo 主要聚焦在：右上角浮出的通知体验、**liquid glass** 视觉风格、多卡片堆叠行为，以及可配置的弹簧动画预设。

---

## 项目简介

这个 Demo 提供了一个可交互的通知演示环境，包含以下能力：

* macOS 风格的浮动通知卡片
* liquid glass 风格的视觉处理
* 多个通知的堆叠与展开行为
* 超过最大数量时自动移除最旧卡片
* 可配置的卡片外观
* 可配置的入场动画与 spring 动画预设

它更适合作为一个视觉原型和交互 Demo，而不是一个可直接投入生产环境的通知库。

---

## 技术栈

* **React**
* **Tailwind CSS**
* **Framer Motion**
* **lucide-react** 图标
* **shadcn/ui** 的 `Button` 和 `Card`

---

## 主要功能

### 1. 类 macOS 的通知位置

通知会出现在预览区域的**右上角**，行为上接近桌面系统中的通知弹出方式。

### 2. Liquid glass 卡片风格

卡片使用了以下视觉元素：

* 半透明表面
* 背景模糊
* 柔和边框
* 细腻阴影
* 玻璃感高光层

### 3. 多卡片堆叠

新的通知会插入到堆叠顶部。

在折叠状态下：

* 只显示有限数量的可见卡片
* 更深层的卡片会逐步压缩
* 超出阈值的卡片会被隐藏

在展开状态下：

* 所有当前可见的卡片会纵向排开
* 每张卡片都更容易单独查看

### 4. 最大实例控制

堆叠数量受到 `MAX_NOTIFICATIONS` 限制。

当新增通知超出上限时，**最旧的卡片会被自动移除**。

### 5. 可配置的外观

当前 Demo 支持：

* 背景模糊开关
* 白色 / neutral 卡片主题切换
* 卡片背景透明度预设

### 6. 可配置的动效预设

当前 Demo 支持多种入场动画预设：

* `slide-right`
* `slide-left`
* `slide-top`
* `slide-top-scale`
* `scale`
* `fade`

同时也支持多种 spring 动画预设：

* `gentle`
* `snappy`
* `bouncy`
* `heavy`
* `elastic`

---

## 当前交互方式

### 添加通知

左侧控制区包含多个按钮，可用于生成不同类型的通知：

* 随机通知
* 成功卡片
* 消息卡片
* 警告卡片

### 展开 / 折叠堆叠

你可以通过以下方式控制堆叠状态：

* 点击控制按钮手动切换展开与折叠
* 鼠标移入预览区域中的通知堆叠时自动展开
* 鼠标移出后重新折叠

### 移除通知

每张卡片都带有单独的关闭按钮。

此外，还提供了一个 **Clear All** 按钮，用于一次性清空所有通知。

---

## 配置项说明

这个 Demo 使用一个 `DEFAULT_CONFIG` 对象：

```ts
const DEFAULT_CONFIG = {
  blurBackground: true,
  cardTheme: "neutral",
  cardOpacity: 0.72,
  animationPreset: "slide-right",
  springPreset: "snappy",
};
```

### 配置字段

#### `blurBackground`

类型：`boolean`

控制卡片表面是否启用 backdrop blur 背景模糊。

#### `cardTheme`

类型：`"white" | "neutral"`

控制卡片的基础主题颜色。

#### `cardOpacity`

类型：`number`

控制卡片背景的透明度。

当前 Demo 里的预设值包括：

* `0.48`
* `0.64`
* `0.8`
* `0.94`

#### `animationPreset`

类型：`string`

控制新卡片的进入与退出方式。

可选预设：

* `slide-right`
* `slide-left`
* `slide-top`
* `slide-top-scale`
* `scale`
* `fade`

#### `springPreset`

类型：`string`

控制 Framer Motion 使用的弹簧手感。

可选预设：

* `gentle`
* `snappy`
* `bouncy`
* `heavy`
* `elastic`

---

## Notification 数据结构

通知数据会先由一个模板定义生成，再转换成运行时使用的卡片数据。

示例：

```ts
{
  id: string,
  title: string,
  message: string,
  icon: LucideIcon,
  accent: string,
  time: string,
  index: number,
}
```

---

## 堆叠行为说明

### 插入顺序

新通知会被插入到数组最前面：

```ts
const next = [createNotification(template, counter), ...prev];
```

### 溢出处理

通知堆叠会通过下面这段逻辑裁剪：

```ts
return next.slice(0, MAX_NOTIFICATIONS);
```

这意味着：会优先保留最新的通知，而最旧的通知会最先被移除。

### 折叠态布局行为

折叠状态下会使用：

* 更小的纵向位移
* 更深层卡片的轻微缩放
* 背景卡片透明度降低
* 超出可见阈值后的卡片隐藏

### 展开态布局行为

展开状态下，卡片会在纵向上拉开距离，便于逐张阅读。

---

## 动画系统说明

每张卡片都基于 Framer Motion 实现，主要使用了：

* `initial`
* `animate`
* `exit`
* `layout`
* 基于 spring 的 `transition`

当前系统中，`animationPreset` 同时决定了进入和退出动画。

示例：

```tsx
<motion.div
  layout
  initial={activeAnimationPreset.initial}
  animate={{ opacity, x: 0, y, scale, filter: `blur(${blur}px)` }}
  exit={activeAnimationPreset.exit}
  transition={activeSpringPreset}
/>
```

---

## 视觉设计说明

这个 Demo 并不是为了完全还原原生 macOS 通知。

它更像是一种融合方案，结合了：

* macOS 风格的位置与动效方向
* 更偏风格化的 liquid glass 视觉语言
* 参考 Sonner 一类库的堆叠 toast 行为

---

## 当前限制

这个 Demo 目前还有以下限制：

* 没有自动消失计时器
* 没有进度条
* 没有 swipe / drag-to-dismiss
* 没有键盘快捷操作
* 没有通知分组
* 没有基于 portal 的全局通知管理器
* 还没有对外暴露 `notify()` API
* 进入和退出动画仍然共用同一个 preset 字段

---

## 后续建议

如果你想把这个 Demo 进一步演进成一个可复用组件，建议下一步做这些增强：

### 1. 拆分动画配置

与其继续使用：

```ts
animationPreset: "slide-right"
```

更推荐改成：

```ts
animation: {
  enter: "slide-top",
  exit: "fade",
  spring: "bouncy",
}
```

### 2. 抽离通知管理 API

例如：

```ts
notify({
  title: "Build Complete",
  message: "Production deployment succeeded.",
  variant: "success",
});
```

### 3. 增加自动消失支持

为每条通知增加可选时长，并支持 hover 时暂停计时。

### 4. 增加手势关闭

支持横向拖拽将卡片关闭。

### 5. 把控制区改成真正的配置面板

例如：

* 用 slider 调整透明度
* 用 segmented control 切换主题
* 用 dropdown 切换动画 preset
* 用 slider 单独调节 spring 的 stiffness / damping / mass

---

## 如何复用

这个 Demo 目前是一个单文件的交互组件。

如果你想在其他项目中复用，建议优先抽离这些部分：

* `NotificationCard`
* animation preset 映射表
* spring preset 映射表
* notification 创建辅助函数
* 顶层 `NotificationStack` 容器

然后再把它们包进一个 provider 或状态管理层中。

---

## 适用场景

这个 Demo 比较适合以下用途：

* UI 动效探索
* 设计原型制作
* 通知交互方案验证
* 在 React 中尝试 liquid glass 风格
* 为未来的 toast / notification 系统打基础

---

## 使用说明 / 注意事项

这是一个偏视觉演示性质的组件，适合用于学习、原型验证和内部 UI 探索。

如果你准备把它用于生产环境，建议进一步补充：

* 可访问性检查
* reduced motion 支持
* 更合理的状态架构
* 响应式测试
* 浏览器兼容性验证

---

## 总结

这个项目是一个可配置的通知堆叠 Demo，融合了以下特点：

* 类 macOS 的右上角通知位置
* liquid glass 卡片视觉风格
* 多卡片堆叠行为
* 基于 spring 的动效预设
* 可交互的外观控制能力

它可以作为一个不错的起点，用来继续打造更完整、更精致的 React 通知系统。
