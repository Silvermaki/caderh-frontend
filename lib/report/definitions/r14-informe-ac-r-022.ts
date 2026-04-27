import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R14Filters { cftp?: string; year?: number; quarter?: string; }
export interface R14Row {}

const columns: ColumnDef<R14Row>[] = [];

export const r14Definition: ReportDefinition<R14Filters, R14Row> = {
  id: 'r14-informe-ac-r-022',
  code: 'R14',
  category: 'directorios',
  title: 'Informe trimestral AC-R-022',
  subtitle: 'Plantilla oficial institucional',
  filters: ['cftp', 'year', 'quarter'],
  defaultFilters: { year: new Date().getFullYear() },
  columns,
  variants: { template: true } as any,
  export: { excel: 'server', pdf: 'server' },
  fetcher: async () => {
    const res = await apiGet<{ rows: R14Row[]; total: number; meta?: any }>(
      '/reports/r14-informe-ac-r-022',
    );
    return { rows: res.rows, total: res.total, meta: res.meta };
  },
};

registerReport(r14Definition);
