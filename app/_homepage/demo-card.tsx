import Link from "next/link";
import type { DemoEntry } from "./demos";

export function DemoCard({ demo }: { demo: DemoEntry }) {
  return (
    <Link
      href={demo.route}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-700/60 bg-neutral-800 transition-all duration-200 hover:border-neutral-600 hover:shadow-lg hover:shadow-black/30"
    >
      <div className="relative h-40 overflow-hidden">
        {demo.preview}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-neutral-200 transition-colors group-hover:text-neutral-50">
            {demo.title}
          </span>
          <svg
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-600 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-neutral-400"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M2.5 6h7M6.5 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="text-xs leading-relaxed text-neutral-500">{demo.description}</p>

        {demo.tags && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {demo.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-neutral-700 px-2 py-0.5 font-mono text-[10px] text-neutral-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
