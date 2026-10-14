import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';
import { queryParams } from '../filter-keys';

export interface R5Filters {
  from?: string;
  to?: string;
  project?: string[];
  cftp?: string[];
  technicalArea?: string[];
  gender?: string[];
}

/** Una fila por egresado que recibió kit de emprendimiento, según su seguimiento. */
export interface R5Row {
  num: number;
  nombre_completo: string;
  dni: string;
  sexo: string | null;
  centro: string;
  centro_siglas: string | null;
  curso: string;
  codigo_proceso: string;
  proyectos: string;
  negocio: string | null;
  rubro: string | null;
  monto: number | null;
  fecha_kit: string;
  situacion: string | null;
  fecha_ultimo: string | null;
}

const columns: ColumnDef<R5Row>[] = [
  { key: 'num',             label: '#',                  align: 'right', format: 'count' },
  { key: 'nombre_completo', label: 'Nombre',             align: 'left',  format: 'text' },
  { key: 'dni',             label: 'DNI',                align: 'left',  format: 'text' },
  { key: 'sexo',            label: 'Sexo',               align: 'left',  format: 'text', pdf: false },
  { key: 'centro',          label: 'Centro',             align: 'left',  format: 'text' },
  { key: 'curso',           label: 'Curso',              align: 'left',  format: 'text', pdf: false },
  { key: 'codigo_proceso',  label: 'Código',             align: 'left',  format: 'text', pdf: false },
  { key: 'proyectos',       label: 'Proyecto(s)',        align: 'left',  format: 'text', hideIfEmpty: true, pdf: false },
  { key: 'negocio',         label: 'Emprendimiento',     align: 'left',  format: 'text' },
  { key: 'rubro',           label: 'Rubro',              align: 'left',  format: 'text' },
  { key: 'monto',           label: 'Monto del kit',      align: 'right', format: 'money' },
  { key: 'fecha_kit',       label: 'Kit registrado el',  align: 'left',  format: 'date' },
  { key: 'situacion',       label: 'Situación actual',   align: 'left',  format: 'text' },
  { key: 'fecha_ultimo',    label: 'Último seguimiento', align: 'left',  format: 'date', pdf: false },
];

export const r5Definition: ReportDefinition<R5Filters, R5Row> = {
  id: 'r5-kits-emprendimiento',
  code: 'R5',
  category: 'estudiantes',
  title: 'Kits de emprendimiento entregados',
  subtitle:
    'Egresados que recibieron kit de emprendimiento, según su seguimiento: emprendimiento, rubro, monto y situación actual.',
  filters: ['dateRange', 'project', 'cftp', 'technicalArea', 'gender'],
  filterLabels: {
    dateRange: { label: 'Registro del kit', description: 'Kits registrados en seguimientos de este rango.' },
  },
  defaultFilters: {},
  columns,
  // Sin kits en todo el sistema la causa no son los filtros: aún no se
  // registran en el seguimiento de los egresados.
  emptyState: (page) => page.meta?.hayKits === false
    ? {
        title: 'Aún no hay kits registrados',
        text: 'Este reporte se llena con el seguimiento de los egresados: al registrar el estatus "Emprendiendo" se indica si recibió kit de emprendimiento y el monto, en Centros → Egresados.',
        action: { label: 'Ir a Seguimiento de egresados', href: '/dashboard/centros/egresados?tab=seguimiento' },
      }
    : null,
  variants: {
    kpiStrip: {
      cards: [
        { key: 'kits',               label: 'Kits entregados',     color: 'info' },
        { key: 'montoTotal',         label: 'Monto total',         color: 'accent', format: 'money' },
        { key: 'montoPromedio',      label: 'Monto promedio',      color: 'accent', format: 'money' },
        { key: 'siguenEmprendiendo', label: 'Siguen emprendiendo', color: 'success' },
      ],
    },
    chart: {
      kind: 'bar',
      title: 'Kits entregados por centro',
      subtitle: 'Número de egresados con kit (los 10 centros con más kits)',
      xKey: 'centro',
      xLabel: 'Centro',
      yLabel: 'Kits',
      valueFormat: (v: number) => v.toLocaleString('es-HN'),
      series: [{ key: 'kits', label: 'Kits', color: 'primary' }],
      data: (rows: R5Row[]) => {
        const porCentro = new Map<string, number>();
        for (const r of rows) {
          const centro = r.centro_siglas || r.centro;
          porCentro.set(centro, (porCentro.get(centro) ?? 0) + 1);
        }
        return Array.from(porCentro, ([centro, kits]) => ({ centro, kits }))
          .sort((a, b) => b.kits - a.kits)
          .slice(0, 10);
      },
    },
  },
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters) => {
    const res = await apiGet<{
      rows: R5Row[]; total: number; totals?: Record<string, number>; kpis?: Record<string, number>; meta?: Record<string, unknown>;
    }>(
      '/reports/r5-kits-emprendimiento',
      queryParams(r5Definition.filters, filters as Record<string, unknown>),
    );
    return { rows: res.rows, total: res.total, totalsRow: res.totals, kpis: res.kpis, meta: res.meta };
  },
};

registerReport(r5Definition);
