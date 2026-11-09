import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import HarkProSignin from "./signin";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-hark-serif",
  style: ["normal", "italic"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Hark Pro Sign-in · Playground",
  description:
    "像素级复刻 Hark Pro macOS 登录窗：草甸壁纸、深海军蓝窗体、人像卡片与登录表单。",
};

export default function HarkProSigninPage() {
  return <HarkProSignin fontClassName={newsreader.variable} />;
}
