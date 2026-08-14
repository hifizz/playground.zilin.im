import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dot Grid Loader Playground",
};

export default function DotAnimationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
