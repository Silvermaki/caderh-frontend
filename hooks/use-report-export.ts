'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { buildWorkbook, downloadWorkbook } from '@/components/report/export/export-to-xlsx';
import { requestPdfExport, triggerBlobDownload } from '@/components/report/export/export-pdf';
import type { ColumnDef, ReportDefinition } from '@/lib/report/types';

export function useReportExport<TFilters, TRow>(
  def: ReportDefinition<TFilters, TRow>,
  filters: TFilters,
  currentRows: TRow[],
  flatColumns: ColumnDef<TRow>[]
) {
  const [busy, setBusy] = useState(false);

  async function doExport(kind: 'xlsx' | 'pdf' | 'csv') {
    setBusy(true);
    const dismissId = toast.loading(`Generando ${kind.toUpperCase()}…`);
    try {
      const missing = flatColumns.filter((c) => c.missingInDb).map((c) => c.label);
      if (kind === 'xlsx' || kind === 'csv') {
        const wb = buildWorkbook({
          title: def.title,
          columns: flatColumns,
          rows: currentRows,
          filtersApplied: filters as any,
          missingColumns: missing,
        });
        const fname = `${def.code}_${def.id}.${kind}`;
        downloadWorkbook(wb, fname);
      } else {
        const blob = await requestPdfExport(def.id, filters as any);
        triggerBlobDownload(blob, `${def.code}_${def.id}.pdf`);
      }
      toast.success('Archivo listo', { id: dismissId });
    } catch (e) {
      toast.error('Error generando archivo', { id: dismissId });
    } finally {
      setBusy(false);
    }
  }

  return { doExport, busy };
}
