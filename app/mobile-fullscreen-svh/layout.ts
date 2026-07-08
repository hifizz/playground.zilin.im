import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // 刘海屏：内容铺满，配合 env(safe-area-inset-*) 顶出头尾
  viewportFit: 'cover',
  // 软键盘弹出时挤压布局，而非遮挡输入框（视口单位本身对键盘无感）
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export const metadata: Metadata = {
  title: '移动端全屏高度：纯 CSS svh/dvh 对比 Demo（实验）',
  description:
    '未验收的替代方案：不写 JS，纯 CSS 用 svh/lvh/dvh，实时切换对比在真机上的表现。对照 /mobile-fullscreen 的混合渐进增强方案。',
  appleWebApp: {
    capable: true,
    title: '全屏 svh Demo',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
