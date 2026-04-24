import type { ReportCategoryMeta } from '@/lib/report/registry';
import type { ReportDefinition } from '@/lib/report/types';
import { ReportRow } from './report-row';
import { cn } from '@/lib/utils';

export interface ReportCategoryCardProps {
  meta: ReportCategoryMeta;
  reports: ReportDefinition<any, any>[];
}

export function ReportCategoryCard({ meta, reports }: ReportCategoryCardProps) {
  if (reports.length === 0) return null;

  const Icon = meta.icon;

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-5 flex flex-col gap-3',
        'transition-shadow hover:shadow-sm',
        meta.accentDestructive && 'border-l-[3px] border-l-destructive'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-muted p-2 shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-semibold leading-tight">{meta.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
          </div>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold shrink-0">
          {reports.length}
        </span>
      </div>
      <div className="border-t pt-2 space-y-0.5">
        {reports.map((r) => (
          <ReportRow key={r.id} report={r} />
        ))}
      </div>
    </div>
  );
}
