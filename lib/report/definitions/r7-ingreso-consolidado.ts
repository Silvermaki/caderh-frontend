import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R7Filters { year?: number; }
export interface R7Row {
  year: number;
  quarter: string;
  /** Fuentes de financiamiento + donaciones en efectivo del trimestre. */
  ingresos: number;
  /** Gastos pagados con efectivo (sin los imputados a suministros/beneficios). */
  gastos: number;
  /** Gastos ÷ ingresos acumulados del año hasta el trimestre; null = N/D. */
  pctEjecucionAcumulado: number | null;
  /** Donaciones en suministros y beneficios: informativas, no suman. */
  donacionesEspecieBeneficio: number;
}

const money = (n: number) => n.toLocaleString('es-HN', { style: 'currency', currency: 'HNL' });
const pct = (n: number | null) => (n == null ? 'N/D' : `${n.toFixed(1)}%`);

const columns: ColumnDef<R7Row>[] = [
  { key: 'year',     label: 'Año',       align: 'left',  render: (r) => String(r.year) },
  { key: 'quarter',  label: 'Trimestre', align: 'left',  render: (r) => r.quarter },
  { key: 'ingresos', label: 'Ingresos en efectivo', align: 'right', render: (r) => money(r.ingresos) },
  { key: 'gastos',   label: 'Gastos en efectivo',   align: 'right', render: (r) => money(r.gastos) },
  { key: 'pctEjecucionAcumulado', label: '% ejecución acumulado', align: 'right', render: (r) => pct(r.pctEjecucionAcumulado) },
  { key: 'donacionesEspecieBeneficio', label: 'Especie y beneficio (no suma)', align: 'right', render: (r) => money(r.donacionesEspecieBeneficio) },
];

export const r7Definition: ReportDefinition<R7Filters, R7Row> = {
  id: 'r7-ingreso-consolidado',
  code: 'R7',
  category: 'ingresos',
  title: 'Ingreso total consolidado',
  subtitle: 'Ingresos y gastos en efectivo por trimestre, con % de ejecución acumulado. Suministros y beneficios se informan aparte y no suman.',
  filters: ['year'],
  defaultFilters: { year: new Date().getFullYear() },
  columns,
  variants: {
    kpiStrip: {
      cards: [
        { key: 'ingresoPeriodo',             label: 'Ingreso del período',   color: 'info',    format: 'money' },
        { key: 'gastosPeriodo',              label: 'Gastos del período',    color: 'warning', format: 'money' },
        { key: 'pctEjecucionGlobal',         label: '% de ejecución',        color: 'success', format: 'percent' },
        { key: 'donacionesEspecieBeneficio', label: 'Especie y beneficio',   color: 'accent',  format: 'money' },
      ],
    },
    // Sobre-ejecución: lo gastado supera lo ingresado en efectivo.
    conditionalRed: {
      when: (r: R7Row) => (r.pctEjecucionAcumulado ?? 0) > 100,
      cells: ['pctEjecucionAcumulado'],
    },
    chart: {
      kind: 'groupedBar',
      title: 'Ingresos vs gastos por trimestre',
      subtitle: 'Solo efectivo: fuentes + donaciones en efectivo contra gastos pagados con efectivo',
      xKey: 'periodo',
      xLabel: 'Período',
      yLabel: 'Lempiras (L)',
      valueFormat: (v: number) => `L ${(v / 1000).toFixed(0)}K`,
      series: [
        { key: 'ingresos', label: 'Ingresos en efectivo', color: 'info' },
        { key: 'gastos',   label: 'Gastos en efectivo',   color: 'warning' },
      ],
      data: (rows: R7Row[]) =>
        rows.map((r) => ({
          periodo: `${r.year} · ${r.quarter}`,
          ingresos: r.ingresos ?? 0,
          gastos: r.gastos ?? 0,
        })),
    },
  } as any,
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters) => {
    const res = await apiGet<{ rows: R7Row[]; total: number; kpis?: Record<string, number>; totals?: any }>(
      '/reports/r7-ingreso-consolidado',
      { year: filters.year },
    );
    return { rows: res.rows, total: res.total, kpis: res.kpis, totalsRow: res.totals };
  },
};

registerReport(r7Definition);
