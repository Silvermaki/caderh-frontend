"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  label: string;
}

export interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

export function TableOfContents({ items, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = React.useState<string | null>(
    items[0]?.id ?? null
  );

  React.useEffect(() => {
    if (items.length === 0) return;
    const observers: IntersectionObserver[] = [];
    const visible = new Map<string, number>();

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              visible.set(item.id, entry.intersectionRatio);
            } else {
              visible.delete(item.id);
            }
          });
          if (visible.size > 0) {
            const sortedIds = items
              .map((i) => i.id)
              .filter((id) => visible.has(id));
            if (sortedIds[0]) setActiveId(sortedIds[0]);
          }
        },
        { rootMargin: "-15% 0px -70% 0px", threshold: [0, 0.5, 1] }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside
      aria-label="Tabla de contenidos"
      className={cn("text-sm", className)}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        En esta página
      </p>
      <ul className="space-y-1.5 border-l border-border">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  "block pl-3 -ml-px border-l text-[13px] leading-snug py-1",
                  "transition-colors duration-150",
                  active
                    ? "border-primary text-primary font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
