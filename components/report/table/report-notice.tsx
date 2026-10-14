'use client';

import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import type { DataNotice } from '@/lib/report/types';

/** Aviso sobre los resultados (faltan datos por registrar), con enlace al módulo. */
export function ReportNotice({ notice }: { notice: DataNotice }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm mb-4 sm:flex-row sm:items-center">
      <div className="flex items-start gap-2 min-w-0">
        <Info className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <p className="text-foreground">
          {notice.title && <span className="font-medium">{notice.title} </span>}
          {notice.text}
        </p>
      </div>
      {notice.action && (
        <Link
          href={notice.action.href}
          className="inline-flex items-center gap-1 shrink-0 pl-6 sm:pl-0 sm:ml-auto font-medium text-primary hover:underline underline-offset-2"
        >
          {notice.action.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
