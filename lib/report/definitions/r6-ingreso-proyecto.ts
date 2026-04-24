import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R6Filters {
  project?: string[];
  year?: number;
}

export interface R6Row {
  projectId: string;
  projectName: string;
  presupuestoGlobal: number;
  presupuestoAnual: number;
  desembolsoQ1: number;
  desembolsoQ2: number;
  desembolsoQ3: number;
  desembolsoQ4: number;
  totalDesembolsado: number;
  pctEjecucion: number;
  donacionesEspecie: number;
  donacionesEfectivo: number;
}

const money = (n: number) =>
  n.toLocaleString('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 });
const pct = (n: number) => `${n.toFixed(1)}%`;

const columns: ColumnDef<R6Row>[] = [
  { key: 'projectName',        label: 'Proyecto / Fuente',    align: 'left',  render: (r) => r.projectName },
  { key: 'presupuestoGlobal',  label: 'Presupuesto global',   align: 'right', render: (r) => money(r.presupuestoGlobal) },
  { key: 'presupuestoAnual',   label: 'Presupuesto anual',    align: 'right', render: (r) => money(r.presupuestoAnual) },
  { key: 'desembolsoQ1',       label: 'Desemb. Q1',           align: 'right', render: (r) => money(r.desembolsoQ1) },
  { key: 'desembolsoQ2',       label: 'Desemb. Q2',           align: 'right', render: (r) => money(r.desembolsoQ2) },
  { key: 'desembolsoQ3',       label: 'Desemb. Q3',           align: 'right', render: (r) => money(r.desembolsoQ3) },
  { key: 'desembolsoQ4',       label: 'Desemb. Q4',           align: 'right', render: (r) => money(r.desembolsoQ4) },
  { key: 'totalDesembolsado',  label: 'Total desembolsado',   align: 'right', render: (r) => money(r.totalDesembolsado) },
  { key: 'pctEjecucion',       label: '% Ejecución',          align: 'right', render: (r) => pct(r.pctEjecucion) },
  { key: 'donacionesEspecie',  label: 'Donaciones especie',   align: 'right', render: (r) => money(r.donacionesEspecie) },
  { key: 'donacionesEfectivo', label: 'Donaciones efectivo',  align: 'right', render: (r) => money(r.donacionesEfectivo) },
];

export const r6Definition: ReportDefinition<R6Filters, R6Row> = {
  id: 'r6-ingreso-proyecto',
  code: 'R6',
  category: 'ingresos',
  title: 'Ingreso total por proyecto',
  subtitle: 'Presupuesto vs desembolsos trimestrales, con % de ejecución',
  filters: ['project', 'year'],
  defaultFilters: { year: new Date().getFullYear() },
  columns,
  variants: {
    conditionalRed: {
      when: (r: R6Row) => r.totalDesembolsado < r.presupuestoAnual && r.presupuestoAnual > 0,
      cells: ['totalDesembolsado', 'pctEjecucion'],
    },
  },
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters, pagination) => {
    const page = pagination.offset !== undefined && pagination.limit
      ? Math.floor(pagination.offset / pagination.limit) + 1
      : 1;
    const pageSize = pagination.limit ?? 25;
    const res = await apiGet<{ rows: R6Row[]; total: number; totals?: any }>(
      '/reports/r6-ingreso-proyecto',
      {
        project: filters.project?.join(','),
        year: filters.year,
        page,
        page_size: pageSize,
      },
    );
    return { rows: res.rows, total: res.total, totalsRow: res.totals };
  },
};

registerReport(r6Definition);
