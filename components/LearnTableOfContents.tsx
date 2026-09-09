"use client";

import { useEffect, useState } from "react";
import type { LearnTocItem } from "@/lib/learnTableOfContents";

type LearnTableOfContentsProps = {
  items: LearnTocItem[];
};

export function LearnTableOfContents({ items }: LearnTableOfContentsProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.length) return;

    let animationFrame: number | null = null;
    const updateActiveHeading = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const headerHeight = Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--header-height")
        ) || 72;
        const readingLine = headerHeight + 36;
        let nextActiveId = items[0].id;

        for (const item of items) {
          const heading = document.getElementById(item.id);
          if (heading && heading.getBoundingClientRect().top <= readingLine) {
            nextActiveId = item.id;
          } else {
            break;
          }
        }

        setActiveId((current) => (current === nextActiveId ? current : nextActiveId));
      });
    };

    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    window.addEventListener("resize", updateActiveHeading);
    updateActiveHeading();

    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [items]);

  return (
    <aside className="learn-table-of-contents" aria-label="Table of contents">
      <p>Table to contents</p>
      <nav>
        <ol>
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <li className={item.level === 3 ? "is-subheading" : undefined} key={item.id}>
                <a
                  className={isActive ? "is-active" : undefined}
                  href={`#${item.id}`}
                  aria-current={isActive ? "location" : undefined}
                  onClick={() => setActiveId(item.id)}
                >
                  {item.text}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}
