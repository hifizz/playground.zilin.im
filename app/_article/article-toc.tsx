"use client";

import { useEffect, useState } from "react";

type Heading = { id: string; text: string };

export function ArticleToc({ label = "Contents" }: { label?: string }) {
  const [items, setItems] = useState<Heading[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const collect = () => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>(".art-article h2[id]")
      );
      const headings: Heading[] = nodes.map((h) => ({
        id: h.id,
        text: h.textContent?.trim() || "",
      }));
      setItems(headings);
      return nodes;
    };

    let nodes = collect();
    if (nodes.length === 0) {
      // MDX hydration race — retry once on the next frame.
      const raf = requestAnimationFrame(() => {
        nodes = collect();
        if (nodes.length > 0) setupObserver(nodes);
      });
      return () => cancelAnimationFrame(raf);
    }

    return setupObserver(nodes);

    function setupObserver(headings: HTMLElement[]) {
      if (headings.length === 0) return;
      if (headings[0].id) setActive(headings[0].id);
      const io = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort(
              (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
            );
          if (visible.length > 0) {
            setActive(visible[0].target.id);
          }
        },
        { rootMargin: "-12% 0px -70% 0px", threshold: 0 }
      );
      headings.forEach((h) => io.observe(h));
      return () => io.disconnect();
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <aside className="art-toc" aria-label="Table of contents">
      <span className="art-toc-label">{label}</span>
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              data-active={active === it.id ? "true" : undefined}
              onClick={(e) => {
                const target = document.getElementById(it.id);
                if (target) {
                  e.preventDefault();
                  target.scrollIntoView({ behavior: "smooth", block: "start" });
                  history.replaceState(null, "", `#${it.id}`);
                  setActive(it.id);
                }
              }}
            >
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
