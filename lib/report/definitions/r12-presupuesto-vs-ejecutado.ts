import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R12Filters { project?: string[]; year?: number; }
export interface R12Row {
  projectId: string;
  projectName: string;
  rubroId: number;
  rubroName: string;
  presupuestoProgramado: number | null;
  ejecutadoQ1: number;
  ejecutadoQ2: number;
  ejecutadoQ3: number;
  ejecutadoQ4: number;
  ejecutadoTotal: number;
  pctEjecucion: number | null;
  saldoDisponible: number | null;
}

const money = (n: number | null) =>
  n == null ? '—' : n.toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
const pct = (n: number | null) => n == null ? '—' : `${n.toFixed(1)}%`;

const columns: ColumnDef<R12Row>[] = [
  { key: 'projectName', label: 'Proyecto', align: 'left',  render: (r: R12Row) => r.projectName },
  { key: 'rubroName',   label: 'Rubro',    align: 'left',  render: (r: R12Row) => r.rubroName },
  {
    key: 'presupuestoProgramado', label: 'Presupuesto programado anual', align: 'right',
    missingInDb: true, missingNote: 'No existe tabla de presupuesto programado',
    plannedSource: 'project_budgets (pendiente)',
    render: (r: R12Row) => money(r.presupuestoProgramado),
  } as any,
  { key: 'ejecutadoQ1', label: 'Ejec. Q1', align: 'right', render: (r: R12Row) => money(r.ejecutadoQ1) },
  { key: 'ejecutadoQ2', label: 'Ejec. Q2', align: 'right', render: (r: R12Row) => money(r.ejecutadoQ2) },
  { key: 'ejecutadoQ3', label: 'Ejec. Q3', align: 'right', render: (r: R12Row) => money(r.ejecutadoQ3) },
  { key: 'ejecutadoQ4', label: 'Ejec. Q4', align: 'right', render: (r: R12Row) => money(r.ejecutadoQ4) },
  { key: 'ejecutadoTotal', label: 'Ejecutado total', align: 'right', render: (r: R12Row) => money(r.ejecutadoTotal) },
  {
    key: 'pctEjecucion', label: '% de ejecución', align: 'right',
    missingInDb: true, missingNote: 'Deriva de presupuesto programado (pendiente)',
    render: (r: R12Row) => pct(r.pctEjecucion),
  } as any,
  {
    key: 'saldoDisponible', label: 'Saldo disponible', align: 'right',
    missingInDb: true, missingNote: 'Deriva de presupuesto programado (pendiente)',
    render: (r: R12Row) => money(r.saldoDisponible),
  } as any,
];

export const r12Definition: ReportDefinition<R12Filters, R12Row> = {
  id: 'r12-presupuesto-vs-ejecutado',
  code: 'R12',
  category: 'egresos',
  title: 'Presupuesto ejecutado vs programado',
  subtitle: 'Desglose por rubro, con rojo cuando ejecutado < programado',
  filters: ['project', 'year'],
  defaultFilters: { year: new Date().getFullYear() },
  columns,
  variants: {
    conditionalRed: {
      when: (r: R12Row) => r.presupuestoProgramado != null && r.ejecutadoTotal < r.presupuestoProgramado,
      cells: ['ejecutadoTotal', 'pctEjecucion', 'saldoDisponible'],
    },
  } as any,
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters) => {
    const res = await apiGet<{ rows: R12Row[]; total: number; meta?: any }>(
      '/reports/r12-presupuesto-vs-ejecutado',
      { project: filters.project?.join(','), year: filters.year },
    );
    return { rows: res.rows, total: res.total, meta: res.meta };
  },
};

registerReport(r12Definition);
