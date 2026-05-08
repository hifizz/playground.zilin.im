import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./article.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-liveline-sans",
  axes: ["opsz"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-liveline-serif",
  style: ["italic"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Liveline · playground",
  description:
    "复刻 benji.org/liveline 的版式排版 — 实时折线图组件的展示页。",
};

export default function LivelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} ${newsreader.variable} liveline-root`}>
      {children}
    </div>
  );
}
