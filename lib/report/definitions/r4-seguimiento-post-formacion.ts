import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';
import { queryParams, todayIso } from '../filter-keys';

export interface R4Filters {
  corte?: string;
  from?: string;
  to?: string;
  project?: string[];
  cftp?: string[];
  technicalArea?: string[];
  estatus?: string[];
}

/** Una fila por egresado con su estatus al corte (último seguimiento ≤ corte). */
export interface R4Row {
  num: number;
  nombre_completo: string;
  dni: string;
  sexo: string | null;
  centro: string;
  curso: string;
  codigo_proceso: string;
  cohorte: number;
  fecha_egreso: string | null;
  estatus: string;
  grupo: string;
  fecha_corte: string | null;
  lugar: string | null;
  detalle: string | null;
  rango: string | null;
  kit: string | null;
  pasantia: string | null;
  proyectos: string;
  observaciones: string | null;
}

const columns: ColumnDef<R4Row>[] = [
  { key: 'num',             label: '#',                  align: 'right', format: 'count' },
  { key: 'nombre_completo', label: 'Nombre',             align: 'left',  format: 'text' },
  { key: 'dni',             label: 'DNI',                align: 'left',  format: 'text' },
  { key: 'sexo',            label: 'Sexo',               align: 'left',  format: 'text', pdf: false },
  { key: 'centro',          label: 'Centro',             align: 'left',  format: 'text' },
  { key: 'curso',           label: 'Curso',              align: 'left',  format: 'text' },
  { key: 'codigo_proceso',  label: 'Código',             align: 'left',  format: 'text', pdf: false },
  { key: 'cohorte',         label: 'Cohorte',            align: 'right', format: 'year' },
  { key: 'fecha_egreso',    label: 'Egresó',             align: 'left',  format: 'date', pdf: false },
  { key: 'estatus',         label: 'Estatus',            align: 'left',  format: 'text' },
  { key: 'fecha_corte',     label: 'Fecha del seguimiento', align: 'left', format: 'date' },
  { key: 'lugar',           label: 'Empresa / negocio / institución', align: 'left', format: 'text' },
  { key: 'detalle',         label: 'Puesto / rubro / carrera', align: 'left', format: 'text' },
  { key: 'rango',           label: 'Rango de salario o ingreso', align: 'left', format: 'text' },
  { key: 'kit',             label: 'Kit de emprendimiento', align: 'left', format: 'text', pdf: false },
  { key: 'pasantia',        label: 'Pasantía',           align: 'left',  format: 'text', pdf: false },
  { key: 'proyectos',       label: 'Proyecto(s)',        align: 'left',  format: 'text', hideIfEmpty: true, pdf: false },
  { key: 'observaciones',   label: 'Observaciones',      align: 'left',  format: 'text', pdf: false },
];

// Distribución por estatus (desde los KPIs: no depende del filtro de estatus).
const DISTRIBUCION: Array<{ key: string; label: string }> = [
  { key: 'trabajando',     label: 'Trabajando' },
  { key: 'emprendiendo',   label: 'Emprendiendo' },
  { key: 'estudiando',     label: 'Estudiando' },
  { key: 'busqueda',       label: 'Buscando empleo' },
  { key: 'pasantia',       label: 'En pasantía' },
  { key: 'otro',           label: 'Otro / no aplica' },
  { key: 'sinSeguimiento', label: 'Sin seguimiento' },
];

export const r4Definition: ReportDefinition<R4Filters, R4Row> = {
  id: 'r4-seguimiento-post-formacion',
  code: 'R4',
  category: 'estudiantes',
  title: 'Seguimiento post-formación',
  subtitle:
    'Egresados y su situación a la fecha de corte (último seguimiento registrado): trabajando, emprendiendo, estudiando, en búsqueda de empleo o en pasantía.',
  filters: ['cutoffDate', 'dateRange', 'project', 'cftp', 'technicalArea', 'youthStatus'],
  filterLabels: {
    cutoffDate: { description: 'Estatus de cada egresado a esta fecha: su último seguimiento hasta el corte.' },
    dateRange: { label: 'Cohorte (inicio del curso)', description: 'Egresados de cursos que iniciaron en este rango.' },
    youthStatus: { description: 'Filtra la tabla; los indicadores muestran a todos los egresados.' },
  },
  defaultFilters: () => ({ corte: todayIso() }),
  columns,
  variants: {
    kpiStrip: {
      cards: [
        { key: 'egresados',      label: 'Egresados',       color: 'info' },
        { key: 'trabajando',     label: 'Trabajando',      color: 'success' },
        { key: 'emprendiendo',   label: 'Emprendiendo',    color: 'accent' },
        { key: 'estudiando',     label: 'Estudiando',      color: 'info' },
        { key: 'busqueda',       label: 'Buscando empleo', color: 'warning' },
        { key: 'sinSeguimiento', label: 'Sin seguimiento', color: 'destructive' },
      ],
    },
    chart: {
      kind: 'donut',
      title: 'Situación de los egresados al corte',
      subtitle: 'Un estatus por egresado: el de su último seguimiento',
      xKey: 'estatus',
      series: [{ key: 'egresados', label: 'Egresados' }],
      data: (_rows, ctx) => {
        const k = ctx?.kpis ?? {};
        const total = Number(k.egresados ?? 0);
        if (!total) return [];
        return DISTRIBUCION
          .map((d) => ({ n: Number(k[d.key] ?? 0), label: d.label }))
          .filter((d) => d.n > 0)
          .map((d) => ({ estatus: `${d.label} (${((d.n / total) * 100).toFixed(0)}%)`, egresados: d.n }));
      },
    },
  },
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters) => {
    const res = await apiGet<{ rows: R4Row[]; total: number; kpis?: Record<string, number> }>(
      '/reports/r4-seguimiento-post-formacion',
      queryParams(r4Definition.filters, filters as Record<string, unknown>),
    );
    return { rows: res.rows, total: res.total, kpis: res.kpis };
  },
};

registerReport(r4Definition);
