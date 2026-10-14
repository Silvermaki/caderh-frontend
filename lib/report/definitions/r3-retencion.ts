import type { ReportDefinition, AnyColumn } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';
import { currentYearRange, queryParams } from '../filter-keys';

export interface R3Filters {
  from?: string;
  to?: string;
  project?: string[];
  financingSource?: string[];
  cftp?: string[];
  technicalArea?: string[];
}

/** Una fila por curso (proceso educativo), según el cierre de cada matrícula. */
export interface R3Row {
  centro: string;
  curso: string;
  codigo: string;
  areaTecnica: string;
  inicio: string;
  fin: string;
  estado: string;
  hombresInicial: number;
  mujeresInicial: number;
  totalInicial: number;
  hombresEgresados: number;
  mujeresEgresados: number;
  totalEgresados: number;
  desertores: number;
  sinCierre: number;
  pctRetencion: number | null;
}

const columns: AnyColumn<R3Row>[] = [
  { key: 'centro',      label: 'Centro (CFP)', align: 'left', format: 'text' },
  { key: 'curso',       label: 'Curso',        align: 'left', format: 'text' },
  { key: 'codigo',      label: 'Código',       align: 'left', format: 'text' },
  { key: 'areaTecnica', label: 'Área técnica', align: 'left', format: 'text' },
  { key: 'inicio',      label: 'Inicio',       align: 'left', format: 'date' },
  { key: 'fin',         label: 'Fin',          align: 'left', format: 'date' },
  { key: 'estado',      label: 'Estado',       align: 'left', format: 'text' },
  {
    group: 'Matrícula inicial',
    children: [
      { key: 'hombresInicial', label: 'Hombres', align: 'right', format: 'count' },
      { key: 'mujeresInicial', label: 'Mujeres', align: 'right', format: 'count' },
      { key: 'totalInicial',   label: 'Total',   align: 'right', format: 'count' },
    ],
  },
  {
    group: 'Egresados',
    children: [
      { key: 'hombresEgresados', label: 'Hombres', align: 'right', format: 'count' },
      { key: 'mujeresEgresados', label: 'Mujeres', align: 'right', format: 'count' },
      { key: 'totalEgresados',   label: 'Total',   align: 'right', format: 'count' },
    ],
  },
  { key: 'desertores',   label: 'Desertores',  align: 'right', format: 'count' },
  { key: 'sinCierre',    label: 'Sin cierre',  align: 'right', format: 'count' },
  { key: 'pctRetencion', label: '% Retención', align: 'right', format: 'percent' },
];

export const r3Definition: ReportDefinition<R3Filters, R3Row> = {
  id: 'r3-retencion',
  code: 'R3',
  category: 'estudiantes',
  title: '% de retención',
  subtitle:
    'Matrícula inicial, egresados y desertores por curso. % de retención = egresados ÷ (egresados + desertores); "Sin cierre" son matrículas a las que aún no se les registró el resultado.',
  filters: ['dateRange', 'project', 'financingSource', 'cftp', 'technicalArea'],
  filterLabels: {
    dateRange: { label: 'Inicio del curso', description: 'Cursos que iniciaron en este rango.' },
  },
  defaultFilters: currentYearRange,
  columns,
  // Cursos ya terminados con matrículas sin cierre: no entran en el % de
  // retención hasta que se registre si egresaron o desertaron.
  notice: (page) => {
    const n = page.rows
      .filter((r) => r.estado === 'Terminado')
      .reduce((s, r) => s + (r.sinCierre ?? 0), 0);
    if (n === 0) return null;
    return {
      text: n === 1
        ? '1 matrícula de un curso ya terminado no tiene registrado si el estudiante egresó o desertó; por eso no cuenta en el % de retención.'
        : `${n.toLocaleString('es-HN')} matrículas de cursos ya terminados no tienen registrado si el estudiante egresó o desertó; por eso no cuentan en el % de retención.`,
      action: { label: 'Ir a Cierre de cursos', href: '/dashboard/centros/egresados' },
    };
  },
  variants: {
    compoundHeaders: true,
    kpiStrip: {
      cards: [
        { key: 'totalInicial',       label: 'Matrícula inicial', color: 'info' },
        { key: 'totalEgresados',     label: 'Egresados',         color: 'success' },
        { key: 'totalDesertores',    label: 'Desertores',        color: 'destructive' },
        { key: 'totalSinCierre',     label: 'Sin cierre',        color: 'warning' },
        { key: 'pctRetencionGlobal', label: '% Retención',       color: 'accent', format: 'percent' },
      ],
    },
    chart: {
      kind: 'bar',
      title: '% de retención por centro',
      subtitle: 'Sobre las matrículas con cierre registrado (las 10 con más cierres)',
      xKey: 'centro',
      xLabel: 'Centro',
      yLabel: '% Retención',
      valueFormat: (v: number) => `${v.toFixed(1)}%`,
      series: [{ key: 'pctRetencion', label: '% Retención', color: 'success' }],
      data: (rows: R3Row[]) => {
        const byCentro = new Map<string, { centro: string; egresados: number; desertores: number }>();
        for (const r of rows) {
          // Etiqueta corta: siglas del centro ("CFP-X — Nombre" → "CFP-X").
          const centro = r.centro.split(' — ')[0];
          const acc = byCentro.get(centro) ?? { centro, egresados: 0, desertores: 0 };
          acc.egresados += r.totalEgresados ?? 0;
          acc.desertores += r.desertores ?? 0;
          byCentro.set(centro, acc);
        }
        return Array.from(byCentro.values())
          .filter((c) => c.egresados + c.desertores > 0)
          .sort((a, b) => (b.egresados + b.desertores) - (a.egresados + a.desertores))
          .slice(0, 10)
          .map((c) => ({ centro: c.centro, pctRetencion: (c.egresados / (c.egresados + c.desertores)) * 100 }));
      },
    },
  },
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters) => {
    const res = await apiGet<{ rows: R3Row[]; total: number; totals?: Record<string, number>; kpis?: Record<string, number> }>(
      '/reports/r3-retencion',
      queryParams(r3Definition.filters, filters as Record<string, unknown>),
    );
    return { rows: res.rows, total: res.total, totalsRow: res.totals, kpis: res.kpis };
  },
};

registerReport(r3Definition);
