import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R8Filters { project?: string[]; year?: number; }
export interface R8Row {
  projectId: string;
  projectName: string;
  overheadPresupuestado: number | null;
  overheadQ1: number;
  overheadQ2: number;
  overheadQ3: number;
  overheadQ4: number;
  overheadTotal: number;
  pctEjecucionOverhead: number | null;
}

const money = (n: number | null) =>
  n == null ? '—' : n.toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
const pct = (n: number | null) => n == null ? '—' : `${n.toFixed(1)}%`;

const columns: ColumnDef<R8Row>[] = [
  { key: 'projectName', label: 'Proyecto', align: 'left', render: (r) => r.projectName },
  {
    key: 'overheadPresupuestado', label: 'Overhead presupuestado', align: 'right',
    missingInDb: true, missingNote: 'No existe tabla de presupuesto programado',
    plannedSource: 'project_budgets (pendiente)',
    render: (r: R8Row) => money(r.overheadPresupuestado),
  } as any,
  { key: 'overheadQ1', label: 'Overhead Q1', align: 'right', render: (r) => money(r.overheadQ1) },
  { key: 'overheadQ2', label: 'Overhead Q2', align: 'right', render: (r) => money(r.overheadQ2) },
  { key: 'overheadQ3', label: 'Overhead Q3', align: 'right', render: (r) => money(r.overheadQ3) },
  { key: 'overheadQ4', label: 'Overhead Q4', align: 'right', render: (r) => money(r.overheadQ4) },
  { key: 'overheadTotal', label: 'Overhead total anual', align: 'right', render: (r) => money(r.overheadTotal) },
  {
    key: 'pctEjecucionOverhead', label: '% ejecución overhead', align: 'right',
    missingInDb: true, missingNote: 'Deriva de overheadPresupuestado (pendiente)',
    render: (r: R8Row) => pct(r.pctEjecucionOverhead),
  } as any,
];

export const r8Definition: ReportDefinition<R8Filters, R8Row> = {
  id: 'r8-overhead',
  code: 'R8',
  category: 'egresos',
  title: 'Overhead por proyecto y total',
  subtitle: 'Trimestral y anual, con % de ejecución',
  filters: ['project', 'year'],
  defaultFilters: { year: new Date().getFullYear() },
  columns,
  variants: {
    conditionalRed: {
      when: (r: R8Row) => r.overheadPresupuestado != null && r.overheadTotal < r.overheadPresupuestado,
      cells: ['overheadTotal', 'pctEjecucionOverhead'],
    },
  } as any,
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters) => {
    const res = await apiGet<{ rows: R8Row[]; total: number; totals?: any; meta?: any }>(
      '/reports/r8-overhead',
      { project: filters.project?.join(','), year: filters.year },
    );
    return { rows: res.rows, total: res.total, totals: res.totals, meta: res.meta };
  },
};

registerReport(r8Definition);
