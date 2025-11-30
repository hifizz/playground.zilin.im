import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // 适配刘海屏关键属性
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export const metadata: Metadata = {
  title: '移动端全屏高度自适应方案 (dvh + Polyfill)',
  description: '演示如何完美解决 iOS Safari 等移动端浏览器地址栏显隐导致的高度跳动问题，实现真正的 100vh 全屏布局。',

  // Apple Web App 能力配置
  appleWebApp: {
    capable: true,
    title: '全屏演示',
    statusBarStyle: 'black-translucent',
  },

  // 格式检测配置
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  // Open Graph 分享配置
  openGraph: {
    title: '移动端全屏高度自适应方案',
    description: '解决移动端浏览器 100vh 问题，支持 dvh 与 Polyfill 降级。',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'Zilin Playground',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: '移动端全屏高度自适应方案',
    description: '解决移动端浏览器 100vh 问题，支持 dvh 与 Polyfill 降级。',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
