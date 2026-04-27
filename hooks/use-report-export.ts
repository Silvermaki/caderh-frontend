'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { buildWorkbook, downloadWorkbook } from '@/components/report/export/export-to-xlsx';
import { requestPdfExport, triggerBlobDownload } from '@/components/report/export/export-pdf';
import type { ColumnDef, ReportDefinition } from '@/lib/report/types';

async function captureChartAsPng(reportId: string): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined;
  const node = document.getElementById(`chart-${reportId}`);
  if (!node) return undefined;
  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(node, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
    });
    return canvas.toDataURL('image/png');
  } catch {
    return undefined;
  }
}

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
        const chartImage = (def.variants as any)?.chart
          ? await captureChartAsPng(def.id)
          : undefined;
        const wb = await buildWorkbook({
          title: def.title,
          code: def.code,
          subtitle: def.subtitle,
          columns: flatColumns,
          rows: currentRows,
          filtersApplied: filters as any,
          missingColumns: missing,
          chartImage,
        });
        const fname = `${def.code}_${def.id}.${kind === 'csv' ? 'xlsx' : kind}`;
        await downloadWorkbook(wb, fname);
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
