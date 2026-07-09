import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R11Filters { cftp?: string; year?: number; quarter?: string; }
export interface R11Row {}

const columns: ColumnDef<R11Row>[] = [];

export const r11Definition: ReportDefinition<R11Filters, R11Row> = {
  id: 'r11-informe-ac-r-022',
  code: 'R11',
  category: 'directorios',
  title: 'Informe trimestral AC-R-022',
  subtitle: 'Plantilla oficial institucional',
  pendingModule:
    'La generación pixel-perfect de la plantilla oficial AC-R-022 está pendiente: necesitamos que CADERH comparta el formato oficial vigente para replicarlo exactamente (celdas, membrete y firmas) en el export a Excel.',
  filters: ['cftp', 'year', 'quarter'],
  defaultFilters: { year: new Date().getFullYear() },
  columns,
  variants: { template: true } as any,
  export: { excel: 'server', pdf: 'server' },
  fetcher: async () => {
    const res = await apiGet<{ rows: R11Row[]; total: number; meta?: any }>(
      '/reports/r11-informe-ac-r-022',
    );
    return { rows: res.rows, total: res.total, meta: res.meta };
  },
};

registerReport(r11Definition);
