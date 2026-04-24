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
    chips.push({ icon: FileText, className: 'text-default-500', title: 'Plantilla' });
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
        'group flex items-center gap-3 rounded-md px-2 py-1.5 -mx-2',
        'hover:bg-primary-100/60 transition-colors'
      )}
    >
      <span className="font-mono text-[11px] font-semibold text-primary-700 w-9 shrink-0 tabular-nums">
        {report.code}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-default-900 leading-tight">{report.title}</div>
        {report.subtitle && (
          <div className="text-xs text-default-500 truncate leading-tight mt-0.5">{report.subtitle}</div>
        )}
      </div>
      {chips.length > 0 && (
        <div className="flex gap-1 items-center shrink-0">
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
      <ChevronRight className="h-4 w-4 text-default-400 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
