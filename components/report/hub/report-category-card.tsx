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
        'rounded-lg border border-default-200 bg-card flex flex-col',
        'transition-all hover:border-primary-200 hover:shadow-sm',
        meta.accentDestructive && 'border-l-[3px] border-l-destructive'
      )}
    >
      <div className="flex items-center justify-between gap-3 p-4 pb-3 border-b border-default-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-md bg-primary-100 text-primary-700 p-2 shrink-0">
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-default-900 leading-tight">{meta.label}</h3>
            <p className="text-xs text-default-500 mt-0.5 truncate">{meta.description}</p>
          </div>
        </div>
        <span className="rounded-full bg-primary-100 text-primary-700 px-2 py-0.5 text-[11px] font-semibold shrink-0 tabular-nums">
          {reports.length}
        </span>
      </div>
      <div className="p-2 space-y-0.5">
        {reports.map((r) => (
          <ReportRow key={r.id} report={r} />
        ))}
      </div>
    </div>
  );
}
