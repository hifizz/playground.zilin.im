import Link from "next/link";

type DemoEntry = {
  title: string;
  description: string;
  route: string;
  category: "Interaction" | "Text Demo" | "Explored Demo" | "Agent UX/UI";
  tags?: string[];
};

const demos: DemoEntry[] = [
  {
    title: "Dynamic Island",
    description: "iOS Dynamic Island — 12 interaction states with Framer Motion spring physics.",
    route: "/dynamic-island",
    category: "Interaction",
    tags: ["Framer Motion", "iOS"],
  },
  {
    title: "Notification Stack",
    description: "macOS-style glass-morphism notification stack with configurable spring presets.",
    route: "/notification-spring-macos",
    category: "Interaction",
    tags: ["Framer Motion", "Glass"],
  },
  {
    title: "Share Dialog",
    description: "Multi-state share modal with public / access-code modes and layout animations.",
    route: "/share-dialog",
    category: "Interaction",
    tags: ["Framer Motion"],
  },
  {
    title: "List Animation",
    description: "Configurable spring list with top-insert enter effects and preset switching.",
    route: "/list-animation",
    category: "Interaction",
    tags: ["Framer Motion"],
  },
  {
    title: "Timeline Minimap",
    description: "Chat timeline navigator with IntersectionObserver highlights and scroll-jump.",
    route: "/minimap",
    category: "Interaction",
    tags: ["IntersectionObserver"],
  },
  {
    title: "Sync Button",
    description: "Three variants of an animated sync / loading button — Framer Motion & pure CSS.",
    route: "/sync-button",
    category: "Interaction",
    tags: ["CSS Animation"],
  },
  {
    title: "Stock Calculator",
    description: "USD / CNY P&L calculator with buy, sell, and target-price inputs.",
    route: "/calc",
    category: "Interaction",
    tags: ["Utility"],
  },
  {
    title: "Mobile Fullscreen",
    description: "Feature-detection based viewport-height adaptation for mobile browsers.",
    route: "/mobile-fullscreen",
    category: "Explored Demo",
    tags: ["Mobile"],
  },
];

function groupByCategory(items: DemoEntry[]) {
  const map = new Map<string, DemoEntry[]>();
  for (const item of items) {
    if (!map.has(item.category)) map.set(item.category, []);
    map.get(item.category)!.push(item);
  }
  return map;
}

export default function Home() {
  const groups = groupByCategory(demos);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="border-b border-white/[0.06] px-6 py-5 sm:px-10">
        <p className="font-mono text-xs text-zinc-500 tracking-widest uppercase">
          playground.zilin.im
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          Interactive Demos
        </h1>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        {Array.from(groups.entries()).map(([category, items]) => (
          <section key={category} className="mb-12">
            <h2 className="mb-5 text-xs font-semibold tracking-widest uppercase text-zinc-500">
              {category}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((demo) => (
                <Link
                  key={demo.route}
                  href={demo.route}
                  className="group relative flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-zinc-100 transition-colors group-hover:text-white">
                      {demo.title}
                    </span>
                    <svg
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-400"
                      viewBox="0 0 12 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M2.5 6h7M6.5 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-500">
                    {demo.description}
                  </p>
                  {demo.tags && (
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                      {demo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/[0.06] px-2 py-0.5 font-mono text-[10px] text-zinc-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="border-t border-white/[0.04] px-6 py-4 sm:px-10">
        <p className="text-xs text-zinc-700">
          zilin · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
