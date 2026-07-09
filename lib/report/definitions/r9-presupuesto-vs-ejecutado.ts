import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R9Filters { project?: string[]; year?: number; }
export interface R9Row {
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

const columns: ColumnDef<R9Row>[] = [
  { key: 'projectName', label: 'Proyecto', align: 'left',  render: (r: R9Row) => r.projectName },
  { key: 'rubroName',   label: 'Rubro',    align: 'left',  render: (r: R9Row) => r.rubroName },
  {
    key: 'presupuestoProgramado', label: 'Presupuesto programado anual', align: 'right',
    missingInDb: true, missingNote: 'No existe tabla de presupuesto programado',
    plannedSource: 'project_budgets (pendiente)',
    render: (r: R9Row) => money(r.presupuestoProgramado),
  } as any,
  { key: 'ejecutadoQ1', label: 'Ejec. Q1', align: 'right', render: (r: R9Row) => money(r.ejecutadoQ1) },
  { key: 'ejecutadoQ2', label: 'Ejec. Q2', align: 'right', render: (r: R9Row) => money(r.ejecutadoQ2) },
  { key: 'ejecutadoQ3', label: 'Ejec. Q3', align: 'right', render: (r: R9Row) => money(r.ejecutadoQ3) },
  { key: 'ejecutadoQ4', label: 'Ejec. Q4', align: 'right', render: (r: R9Row) => money(r.ejecutadoQ4) },
  { key: 'ejecutadoTotal', label: 'Ejecutado total', align: 'right', render: (r: R9Row) => money(r.ejecutadoTotal) },
  {
    key: 'pctEjecucion', label: '% de ejecución', align: 'right',
    missingInDb: true, missingNote: 'Deriva de presupuesto programado (pendiente)',
    render: (r: R9Row) => pct(r.pctEjecucion),
  } as any,
  {
    key: 'saldoDisponible', label: 'Saldo disponible', align: 'right',
    missingInDb: true, missingNote: 'Deriva de presupuesto programado (pendiente)',
    render: (r: R9Row) => money(r.saldoDisponible),
  } as any,
];

export const r9Definition: ReportDefinition<R9Filters, R9Row> = {
  id: 'r9-presupuesto-vs-ejecutado',
  code: 'R9',
  category: 'egresos',
  title: 'Presupuesto ejecutado vs programado',
  subtitle: 'Desglose por rubro, con rojo cuando ejecutado < programado',
  filters: ['project', 'year'],
  defaultFilters: { year: new Date().getFullYear() },
  columns,
  variants: {
    conditionalRed: {
      when: (r: R9Row) => r.presupuestoProgramado != null && r.ejecutadoTotal < r.presupuestoProgramado,
      cells: ['ejecutadoTotal', 'pctEjecucion', 'saldoDisponible'],
    },
    chart: {
      kind: 'bar',
      title: 'Ejecutado por rubro',
      subtitle: 'Suma del gasto ejecutado anual por categoría presupuestal',
      xKey: 'rubroName',
      xLabel: 'Rubro',
      yLabel: 'Lempiras (L)',
      valueFormat: (v: number) => `L ${(v / 1000).toFixed(0)}K`,
      series: [
        { key: 'ejecutadoTotal', label: 'Ejecutado', color: 'primary' },
      ],
      data: (rows: R9Row[]) => {
        const byRubro = new Map<string, { rubroName: string; ejecutadoTotal: number }>();
        for (const r of rows) {
          const key = r.rubroName || '—';
          const acc = byRubro.get(key) ?? { rubroName: key, ejecutadoTotal: 0 };
          acc.ejecutadoTotal += r.ejecutadoTotal ?? 0;
          byRubro.set(key, acc);
        }
        return Array.from(byRubro.values()).sort((a, b) => b.ejecutadoTotal - a.ejecutadoTotal).slice(0, 10);
      },
    },
  } as any,
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters) => {
    const res = await apiGet<{ rows: R9Row[]; total: number; meta?: any }>(
      '/reports/r9-presupuesto-vs-ejecutado',
      { project: filters.project?.join(','), year: filters.year },
    );
    return { rows: res.rows, total: res.total, meta: res.meta };
  },
};

registerReport(r9Definition);
