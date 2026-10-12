'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { buildWorkbook, downloadWorkbook } from '@/components/report/export/export-to-xlsx';
import { requestPdfExport, triggerBlobDownload } from '@/components/report/export/export-pdf';
import { ALL_ROWS } from '@/hooks/use-report-query';
import { flattenForExport, visibleOnly } from '@/lib/report/columns';
import { buildCsv } from '@/lib/report/format';
import type { Page, ReportDefinition } from '@/lib/report/types';

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

/**
 * Exportación del reporte con TODAS las filas del filtro (antes Excel/CSV
 * llevaban solo la página visible: 25 filas), la fila de totales y los
 * filtros con nombres legibles. "CSV" ahora es un .csv de verdad.
 */
export function useReportExport<TFilters, TRow>(
  def: ReportDefinition<TFilters, TRow>,
  filters: TFilters,
  appliedFilters: Array<{ label: string; value: string }>,
) {
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  // Misma clave que la tabla cuando pagina en el cliente: reutiliza la caché.
  const loadAll = () =>
    queryClient.fetchQuery<Page<TRow>>({
      queryKey: [def.id, filters, ALL_ROWS],
      queryFn: () => def.fetcher(filters, ALL_ROWS),
      staleTime: 5 * 60 * 1000,
    });

  async function doExport(kind: 'xlsx' | 'pdf' | 'csv') {
    setBusy(true);
    const dismissId = toast.loading(`Generando ${kind.toUpperCase()}…`);
    try {
      const display = Object.fromEntries(appliedFilters.map((a) => [a.label, a.value]));
      if (kind === 'pdf') {
        // Las columnas `hideIfEmpty` se omiten si vienen vacías; con paginación
        // en el servidor no se bajan todas las filas solo para verificarlo.
        const candidates = def.serverPagination
          ? flattenForExport(def.columns).filter((c) => !c.hideIfEmpty)
          : flattenForExport(visibleOnly(def.columns, (await loadAll()).rows ?? []));
        const columns = candidates.filter((c) => c.pdf !== false);
        const omitted = columns.length < candidates.length;
        const blob = await requestPdfExport(def.id, {
          filters: filters as any,
          filtersDisplay: display,
          columns,
          title: def.title,
          subtitle: omitted
            ? `${def.subtitle} Columnas principales; el detalle completo está en la exportación a Excel o CSV.`
            : def.subtitle,
          code: def.code,
        });
        triggerBlobDownload(blob, `${def.code}_${def.id}.pdf`);
      } else {
        const data = await loadAll();
        const rows = data.rows ?? [];
        const columns = flattenForExport(visibleOnly(def.columns, rows));
        if (kind === 'csv') {
          const csv = buildCsv(columns, rows, data.totalsRow);
          triggerBlobDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${def.code}_${def.id}.csv`);
        } else {
          const chartImage = def.variants?.chart ? await captureChartAsPng(def.id) : undefined;
          const wb = await buildWorkbook({
            title: def.title,
            code: def.code,
            subtitle: def.subtitle,
            columns,
            rows,
            totalsRow: data.totalsRow,
            filtersApplied: display,
            missingColumns: columns.filter((c) => c.missingInDb).map((c) => c.label),
            chartImage,
          });
          await downloadWorkbook(wb, `${def.code}_${def.id}.xlsx`);
        }
      }
      toast.success('Archivo listo', { id: dismissId });
    } catch {
      toast.error('Error generando archivo', { id: dismissId });
    } finally {
      setBusy(false);
    }
  }

  return { doExport, busy };
}
