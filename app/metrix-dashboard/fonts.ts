import localFont from "next/font/local";

/* 原站使用 Inter Variable（含 opsz 轴），直接用它的 woff2 */
const inter = localFont({
  src: "./inter.woff2",
  weight: "100 900",
  variable: "--font-mx-inter",
  display: "swap",
});

export const mxFontClass = inter.variable;
