import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R7Filters { year?: number; }
export interface R7Row {
  year: number;
  quarter: string;
  desembolsado: number;
  donaciones: number;
  granTotal: number;
  pctSobrePresupuesto: number;
}

const money = (n: number) => n.toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
const pct = (n: number) => `${n.toFixed(1)}%`;

const columns: ColumnDef<R7Row>[] = [
  { key: 'year',     label: 'Año',       align: 'left',  render: (r) => String(r.year) },
  { key: 'quarter',  label: 'Trimestre', align: 'left',  render: (r) => r.quarter },
  { key: 'desembolsado', label: 'Desembolsado a CADERH', align: 'right', render: (r) => money(r.desembolsado) },
  { key: 'donaciones',   label: 'Donaciones',            align: 'right', render: (r) => money(r.donaciones) },
  { key: 'granTotal',    label: 'Gran total',            align: 'right', render: (r) => money(r.granTotal) },
  { key: 'pctSobrePresupuesto', label: '% s/ presupuesto anual', align: 'right', render: (r) => pct(r.pctSobrePresupuesto) },
];

export const r7Definition: ReportDefinition<R7Filters, R7Row> = {
  id: 'r7-ingreso-consolidado',
  code: 'R7',
  category: 'ingresos',
  title: 'Ingreso total consolidado',
  subtitle: 'Anual y trimestral con % de ejecución global',
  filters: ['year'],
  defaultFilters: { year: new Date().getFullYear() },
  columns,
  variants: {
    kpiStrip: {
      cards: [
        { key: 'ingresoPeriodo',    label: 'Ingreso del período', color: 'info',    format: 'money' },
        { key: 'pctEjecucionGlobal', label: '% ejecución global',  color: 'success', format: 'percent' },
        { key: 'donaciones',        label: 'Donaciones',          color: 'accent',  format: 'money' },
        { key: 'granTotal',         label: 'Gran total',          color: 'info',    format: 'money' },
      ],
    },
  } as any,
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters, pagination) => {
    const res = await apiGet<{ rows: R7Row[]; total: number; kpis?: any }>(
      '/reports/r7-ingreso-consolidado',
      { year: filters.year },
    );
    return { rows: res.rows, total: res.total, kpis: res.kpis };
  },
};

registerReport(r7Definition);
