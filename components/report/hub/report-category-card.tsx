'use client';

import { motion } from 'framer-motion';
import type { ReportCategoryMeta } from '@/lib/report/registry';
import type { ReportDefinition } from '@/lib/report/types';
import { Card } from '@/components/ui/card';
import { ReportRow } from './report-row';
import { cn } from '@/lib/utils';

export interface ReportCategoryCardProps {
  meta: ReportCategoryMeta;
  reports: ReportDefinition<any, any>[];
  index?: number;
}

export function ReportCategoryCard({ meta, reports, index = 0 }: ReportCategoryCardProps) {
  if (reports.length === 0) return null;

  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200">
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 text-primary p-3 shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-foreground leading-tight">{meta.label}</h3>
                <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold tabular-nums">
                  {reports.length} {reports.length === 1 ? 'reporte' : 'reportes'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{meta.description}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-2">
          {reports.map((r) => (
            <ReportRow key={r.id} report={r} />
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
