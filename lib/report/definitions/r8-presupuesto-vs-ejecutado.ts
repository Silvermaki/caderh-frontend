import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';
import { queryParams, todayIso } from '../filter-keys';
import { formatValue } from '../format';

export interface R8Filters {
  project?: string[];
  corte?: string;
}

/** Una fila por proyecto, con las cifras del encabezado del proyecto al corte. */
export interface R8Row {
  projectId: string;
  projectName: string;
  programado: number;
  ejecutado: number;
  saldo: number;
  sobreEjecucion: number | null;
  /** null = hay gasto sin presupuesto (N/D, como en el encabezado). */
  pctEjecucion: number | null;
}

const columns: ColumnDef<R8Row>[] = [
  { key: 'projectName',    label: 'Proyecto',               align: 'left',  format: 'text' },
  { key: 'programado',     label: 'Presupuesto programado', align: 'right', format: 'money' },
  { key: 'ejecutado',      label: 'Presupuesto ejecutado',  align: 'right', format: 'money' },
  { key: 'saldo',          label: 'Saldo disponible',       align: 'right', format: 'money' },
  { key: 'sobreEjecucion', label: 'Sobre ejecución',        align: 'right', format: 'money', hideIfEmpty: true },
  {
    key: 'pctEjecucion', label: '% de ejecución', align: 'right', format: 'percent',
    render: (r) => (r.pctEjecucion == null ? 'N/D' : formatValue(r.pctEjecucion, 'percent')),
  },
];

export const r8Definition: ReportDefinition<R8Filters, R8Row> = {
  id: 'r8-presupuesto-vs-ejecutado',
  code: 'R8',
  category: 'egresos',
  title: 'Presupuesto ejecutado vs programado',
  subtitle:
    'Por proyecto: presupuesto programado (fuentes de financiamiento + donaciones en efectivo) contra lo ejecutado en efectivo, con saldo y % de ejecución. En rojo, los proyectos que ejecutaron más de lo programado.',
  filters: ['project', 'cutoffDate'],
  filterLabels: {
    cutoffDate: { description: 'Ingresos y gastos registrados hasta esta fecha.' },
  },
  defaultFilters: () => ({ corte: todayIso() }),
  columns,
  variants: {
    conditionalRed: {
      when: (r: R8Row) => r.sobreEjecucion != null && r.sobreEjecucion > 0,
      cells: ['ejecutado', 'sobreEjecucion', 'pctEjecucion'],
    },
    kpiStrip: {
      cards: [
        { key: 'programado',   label: 'Presupuesto programado', color: 'info',    format: 'money' },
        { key: 'ejecutado',    label: 'Presupuesto ejecutado',  color: 'accent',  format: 'money' },
        { key: 'saldo',        label: 'Saldo disponible',       color: 'success', format: 'money' },
        { key: 'pctEjecucion', label: '% de ejecución',         color: 'warning', format: 'percent' },
      ],
    },
    chart: {
      kind: 'groupedBar',
      title: 'Programado vs ejecutado por proyecto',
      subtitle: 'Los 10 proyectos con mayor presupuesto programado',
      xKey: 'projectName',
      xLabel: 'Proyecto',
      yLabel: 'Lempiras (L)',
      valueFormat: (v: number) => `L ${(v / 1000).toFixed(0)}K`,
      series: [
        { key: 'programado', label: 'Programado', color: 'info' },
        { key: 'ejecutado',  label: 'Ejecutado',  color: 'success' },
      ],
      data: (rows: R8Row[]) =>
        [...rows]
          .sort((a, b) => b.programado - a.programado)
          .slice(0, 10)
          .map((r) => ({ projectName: r.projectName, programado: r.programado, ejecutado: r.ejecutado })),
    },
  },
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters) => {
    const res = await apiGet<{
      rows: R8Row[]; total: number; totals?: Record<string, number | null>; kpis?: Record<string, number>; meta?: Record<string, unknown>;
    }>(
      '/reports/r8-presupuesto-vs-ejecutado',
      queryParams(r8Definition.filters, filters as Record<string, unknown>),
    );
    return { rows: res.rows, total: res.total, totalsRow: res.totals, kpis: res.kpis, meta: res.meta };
  },
};

registerReport(r8Definition);
