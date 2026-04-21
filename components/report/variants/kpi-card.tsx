'use client';

import { cn } from '@/lib/utils';

export type KpiColor = 'info' | 'success' | 'accent' | 'destructive' | 'warning';

const borderByColor: Record<KpiColor, string> = {
  info: 'border-t-info',
  success: 'border-t-success',
  accent: 'border-t-accent',
  destructive: 'border-t-destructive',
  warning: 'border-t-warning',
};

export interface KpiCardProps {
  label: string;
  value: number | string;
  sub?: string;
  color: KpiColor;
  selected?: boolean;
  onClick?: () => void;
}

export function KpiCard({ label, value, sub, color, selected, onClick }: KpiCardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'text-left rounded-lg border bg-card px-3 py-3 border-t-[3px]',
        borderByColor[color],
        selected && 'bg-muted/60',
        onClick && 'hover:bg-muted/40 transition'
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-bold leading-none mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </Tag>
  );
}
