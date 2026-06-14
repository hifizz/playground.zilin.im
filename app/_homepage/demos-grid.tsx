"use client";

import { useState } from "react";
import { demos, ALL_CATEGORIES } from "./demos";
import { DemoCard } from "./demo-card";

export function DemosGrid() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered =
    activeCategory === "All"
      ? demos
      : demos.filter((d) => d.category === activeCategory);

  return (
    <section id="demos" className="mx-auto max-w-5xl scroll-mt-4 px-6 pt-6 pb-24 sm:pt-8 md:px-0">
      <div className="mb-5 flex gap-1 overflow-x-auto pb-1">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-150 ${
              activeCategory === cat
                ? "bg-neutral-50 text-neutral-900"
                : "text-neutral-500 hover:text-neutral-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((demo) => (
          <DemoCard key={demo.route} demo={demo} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-neutral-600">
          No demos in this category yet.
        </p>
      )}
    </section>
  );
}
