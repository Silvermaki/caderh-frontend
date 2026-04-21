import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ReportCategoryMeta } from '@/lib/report/registry';
import type { ReportDefinition } from '@/lib/report/types';
import { cn } from '@/lib/utils';

export interface ReportCategoryCardProps {
  meta: ReportCategoryMeta;
  reports: ReportDefinition<any, any>[];
}

export function ReportCategoryCard({ meta, reports }: ReportCategoryCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 flex flex-col',
        meta.accentDestructive && 'border-l-[3px] border-l-destructive'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold">{meta.label}</h3>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
          {reports.length}
        </span>
      </div>
      <ul className="space-y-1">
        {reports.map((r) => (
          <li key={r.id}>
            <Link
              href={`/dashboard/reportes/${r.id}`}
              className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-muted/50 text-sm"
            >
              <span>
                <span className="font-mono text-xs text-muted-foreground mr-2">{r.code}</span>
                {r.title}
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </li>
        ))}
        {reports.length === 0 && (
          <li className="text-xs text-muted-foreground italic px-2 py-1.5">
            (aún no hay reportes en esta categoría)
          </li>
        )}
      </ul>
    </div>
  );
}
