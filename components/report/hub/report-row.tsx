import Link from 'next/link';
import { ChevronRight, Flame, Gauge, Layers, Columns, AlertTriangle, FileText } from 'lucide-react';
import type { ReportDefinition } from '@/lib/report/types';
import { cn } from '@/lib/utils';

export interface ReportRowProps {
  report: ReportDefinition<any, any>;
}

interface Chip {
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  title: string;
}

function variantChips(def: ReportDefinition<any, any>): Chip[] {
  const chips: Chip[] = [];
  if (def.variants?.conditionalRed) {
    chips.push({ icon: Flame, className: 'text-destructive', title: 'Formato rojo condicional' });
  }
  if (def.variants?.kpiStrip) {
    chips.push({ icon: Gauge, className: 'text-info', title: 'Con KPIs' });
  }
  if (def.variants?.hierarchical) {
    chips.push({ icon: Layers, className: 'text-primary', title: 'Tabla jerárquica' });
  }
  if (def.variants?.compoundHeaders) {
    chips.push({ icon: Columns, className: 'text-primary', title: 'Encabezados compuestos' });
  }
  if ((def as any).variants?.template) {
    chips.push({ icon: FileText, className: 'text-muted-foreground', title: 'Plantilla' });
  }
  const hasMissing = (def.columns as any[]).some((c) => c.missingInDb);
  if (hasMissing) {
    chips.push({ icon: AlertTriangle, className: 'text-warning', title: 'Tiene columnas sin fuente en DB' });
  }
  return chips;
}

export function ReportRow({ report }: ReportRowProps) {
  const chips = variantChips(report);
  return (
    <Link
      href={`/dashboard/reportes/${report.id}`}
      className={cn(
        'group flex items-center gap-3 p-3 rounded-lg border border-border bg-card',
        'hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm',
        'transition-all duration-200'
      )}
    >
      <span className="font-mono text-[11px] font-bold text-primary shrink-0 tabular-nums w-10">
        {report.code}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground leading-tight">
          {report.title}
        </div>
        {report.subtitle && (
          <div className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
            {report.subtitle}
          </div>
        )}
      </div>
      {chips.length > 0 && (
        <div className="flex gap-1.5 items-center shrink-0">
          {chips.map((c, i) => {
            const Icon = c.icon;
            return (
              <span key={i} title={c.title} aria-label={c.title}>
                <Icon className={cn('h-3.5 w-3.5', c.className)} />
              </span>
            );
          })}
        </div>
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  );
}
