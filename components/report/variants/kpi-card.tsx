'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';

export type KpiColor = 'info' | 'success' | 'accent' | 'destructive' | 'warning';

const iconColorByKpi: Record<KpiColor, string> = {
  info: 'text-info',
  success: 'text-success',
  accent: 'text-primary',
  destructive: 'text-destructive',
  warning: 'text-warning',
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
  rawValue?: number;
  sub?: string;
  color: KpiColor;
  selected?: boolean;
  onClick?: () => void;
  index?: number;
}

export function KpiCard({ label, value, rawValue, sub, color, selected, onClick, index = 0 }: KpiCardProps) {
  const Tag = onClick ? motion.button : motion.div;
  const numericValue = rawValue !== undefined ? rawValue : typeof value === 'number' ? value : null;

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
      className={cn(
        'text-left bg-card border border-border rounded-lg p-4 flex flex-col min-h-[88px]',
        'hover:shadow-md hover:border-primary/20 transition-all duration-200',
        selected && 'border-primary/40 bg-primary/5',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('h-2 w-2 rounded-full shrink-0', iconColorByKpi[color], 'bg-current')} />
        <span className="text-xs text-muted-foreground uppercase tracking-wide leading-tight">
          {label}
        </span>
      </div>
      <p className="text-xl font-bold text-foreground truncate mt-auto">
        {numericValue !== null ? <AnimatedNumber value={numericValue} /> : value}
      </p>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </Tag>
  );
}
