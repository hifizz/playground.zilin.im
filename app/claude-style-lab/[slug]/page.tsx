import { notFound } from "next/navigation";
import { DemoCanvas } from "../_components/demos";
import { DemoShell } from "../_components/demo-shell";
import { claudeStyleDemos, getDemo } from "../catalog";

export function generateStaticParams() {
  return claudeStyleDemos.map((demo) => ({ slug: demo.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = getDemo(slug);
  return demo ? { title: `${demo.number} · ${demo.title} · Claude Style Lab`, description: demo.summary } : {};
}

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = getDemo(slug);
  if (!demo) notFound();
  return <DemoShell demo={demo}><DemoCanvas kind={demo.kind} /></DemoShell>;
}
