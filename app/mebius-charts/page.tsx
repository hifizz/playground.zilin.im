import type { Metadata } from "next";
import MebiusChartsDemo from "./demo";

export const metadata: Metadata = {
  title: "Mebius Charts · Inspired Gallery",
  description:
    "灵感来自 mebius.design 的 62 个金融图表组件：用 recharts 复刻的暗黑卡片画廊，含搜索与类型筛选。",
};

export default function MebiusChartsPage() {
  return <MebiusChartsDemo />;
}
