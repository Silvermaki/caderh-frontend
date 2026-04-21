'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScopeChip {
  key: string;
  label: string;
}

export interface ScopeBarProps {
  activeCount: number;
  chips: ScopeChip[];
  onOpen: () => void;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function ScopeBar({ activeCount, chips, onOpen, onRemove, onClearAll }: ScopeBarProps) {
  const hasActive = activeCount > 0;
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 mb-3">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium border transition',
          hasActive
            ? 'bg-foreground text-background border-foreground'
            : 'bg-transparent text-muted-foreground border-border hover:bg-muted'
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filtros
        {hasActive && (
          <span className="rounded-full bg-background text-foreground text-xs font-bold px-1.5 leading-none py-0.5">
            {activeCount}
          </span>
        )}
      </button>

      {!hasActive && (
        <span className="text-xs text-muted-foreground">Sin filtros — mostrando todo</span>
      )}

      {chips.map((c) => (
        <span
          key={c.key}
          className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs text-foreground"
        >
          {c.label}
          <button
            type="button"
            aria-label={`Remover ${c.label}`}
            onClick={() => onRemove(c.key)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      <div className="flex-1" />

      {hasActive && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-destructive hover:underline underline-offset-2"
        >
          Limpiar todo
        </button>
      )}
    </div>
  );
}
