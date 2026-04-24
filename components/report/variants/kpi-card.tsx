'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';

export type KpiColor = 'info' | 'success' | 'accent' | 'destructive' | 'warning';

const borderByColor: Record<KpiColor, string> = {
  info: 'border-t-info',
  success: 'border-t-success',
  accent: 'border-t-accent',
  destructive: 'border-t-destructive',
  warning: 'border-t-warning',
};

function AnimatedNumber({
  value,
  format,
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) =>
    format ? format(v) : Math.round(v).toLocaleString('es-HN')
  );
  useEffect(() => {
    const controls = animate(count, value, { duration: 0.4, ease: 'easeOut' });
    return controls.stop;
  }, [value, count]);
  return <motion.span>{rounded}</motion.span>;
}

export interface KpiCardProps {
  label: string;
  value: number | string;
  /** Optional raw numeric value for count-up when `value` is a pre-formatted string. */
  rawValue?: number;
  sub?: string;
  color: KpiColor;
  selected?: boolean;
  onClick?: () => void;
}

export function KpiCard({ label, value, rawValue, sub, color, selected, onClick }: KpiCardProps) {
  const Tag = onClick ? 'button' : 'div';

  // Determine if we can animate: use rawValue if provided, or value if it's a number.
  const numericValue = rawValue !== undefined ? rawValue : typeof value === 'number' ? value : null;

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
      <div className="text-2xl font-bold leading-none mt-1">
        {numericValue !== null ? (
          <AnimatedNumber value={numericValue} />
        ) : (
          value
        )}
      </div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </Tag>
  );
}
