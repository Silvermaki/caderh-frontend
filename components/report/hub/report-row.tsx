import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ReportDefinition } from '@/lib/report/types';
import { cn } from '@/lib/utils';

export interface ReportRowProps {
  report: ReportDefinition<any, any>;
}

function variantChips(def: ReportDefinition<any, any>): string[] {
  const chips: string[] = [];
  if (def.variants?.conditionalRed) chips.push('🔴');
  if (def.variants?.kpiStrip) chips.push('▦');
  if (def.variants?.hierarchical) chips.push('⫶');
  if (def.variants?.compoundHeaders) chips.push('▥');
  const hasMissing = (def.columns as any[]).some((c) => c.missingInDb);
  if (hasMissing) chips.push('⚠');
  return chips;
}

export function ReportRow({ report }: ReportRowProps) {
  const chips = variantChips(report);
  return (
    <Link
      href={`/dashboard/reportes/${report.id}`}
      className={cn(
        'group flex items-start gap-3 rounded-md px-2 py-2 -mx-2',
        'hover:bg-muted/60 transition-colors'
      )}
    >
      <span className="font-mono text-xs text-muted-foreground w-8 shrink-0 pt-0.5">
        {report.code}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{report.title}</div>
        {report.subtitle && (
          <div className="text-xs text-muted-foreground truncate">{report.subtitle}</div>
        )}
      </div>
      {chips.length > 0 && (
        <div className="flex gap-1 items-center text-xs shrink-0 pt-0.5" aria-hidden>
          {chips.map((c, i) => (
            <span key={i} className="opacity-70">{c}</span>
          ))}
        </div>
      )}
      <ChevronRight
        className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}
