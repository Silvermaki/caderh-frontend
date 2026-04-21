'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterGroupProps {
  label: string;
  activeCount?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function FilterGroup({ label, activeCount = 0, defaultOpen = true, children }: FilterGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted/40"
      >
        <span className="inline-flex items-center gap-2">
          {label}
          {activeCount > 0 && (
            <span className="rounded-full bg-info/10 text-info-foreground text-[10px] font-semibold px-1.5 py-0.5 normal-case tracking-normal">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition', !open && '-rotate-90')} />
      </button>
      {open && <div className="px-3 pb-3 flex flex-col gap-2">{children}</div>}
    </div>
  );
}
