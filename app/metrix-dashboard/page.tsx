import type { Metadata } from "next";
import MetrixDashboardDemo from "./demo";

export const metadata: Metadata = {
  title: "Metrix Dashboard · Playground",
  description: "复刻 metrix-dashboard：像素柱图 + 跟随 popover、细腻的 0.6px 边框与层次。",
};

export default function MetrixDashboardPage() {
  return <MetrixDashboardDemo />;
}
