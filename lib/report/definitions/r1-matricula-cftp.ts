import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';
import { currentYearRange, queryParams } from '../filter-keys';

export interface R1Filters {
  from?: string;
  to?: string;
  project?: string[];
  financingSource?: string[];
  cftp?: string[];
  technicalArea?: string[];
  city?: string[];
  age_min?: number;
  age_max?: number;
}

/** Una fila por curso (proceso educativo); `rowKind: 'subtotal'` cierra cada área. */
export interface R1Row {
  rowKind?: 'subtotal';
  areaTecnica: string;
  centro: string;
  ciudad: string;
  lugar: string;
  curso: string;
  codigo: string;
  inicio: string;
  fin: string;
  proyectos: string;
  hombres: number;
  mujeres: number;
  total: number;
  pctMujeres: number | null;
}

const columns: ColumnDef<R1Row>[] = [
  { key: 'areaTecnica', label: 'Área técnica', align: 'left', format: 'text' },
  { key: 'centro',      label: 'Centro (CFP)', align: 'left', format: 'text' },
  { key: 'ciudad',      label: 'Ciudad',       align: 'left', format: 'text' },
  // Texto libre del proceso; casi siempre vacío, se oculta si no hay ninguno.
  { key: 'lugar',       label: 'Lugar',        align: 'left', format: 'text', hideIfEmpty: true, pdf: false },
  { key: 'curso',       label: 'Curso',        align: 'left', format: 'text' },
  { key: 'codigo',      label: 'Código',       align: 'left', format: 'text' },
  { key: 'inicio',      label: 'Inicio',       align: 'left', format: 'date' },
  { key: 'fin',         label: 'Fin',          align: 'left', format: 'date' },
  { key: 'proyectos',   label: 'Proyecto(s)',  align: 'left', format: 'text', hideIfEmpty: true, pdf: false },
  { key: 'hombres',     label: 'Hombres',      align: 'right', format: 'count' },
  { key: 'mujeres',     label: 'Mujeres',      align: 'right', format: 'count' },
  { key: 'total',       label: 'Total',        align: 'right', format: 'count' },
  { key: 'pctMujeres',  label: '% Mujeres',    align: 'right', format: 'percent' },
];

export const r1Definition: ReportDefinition<R1Filters, R1Row> = {
  id: 'r1-matricula-cftp',
  code: 'R1',
  category: 'estudiantes',
  title: 'Consolidado matrícula por CFP',
  subtitle: 'Matrícula por área técnica, centro y curso, con hombres y mujeres y subtotal por área.',
  filters: ['dateRange', 'project', 'financingSource', 'cftp', 'technicalArea', 'city', 'age'],
  filterLabels: {
    dateRange: { label: 'Inicio del curso', description: 'Cursos que iniciaron en este rango.' },
    age: { description: 'Edad del estudiante al iniciar el curso.' },
  },
  defaultFilters: currentYearRange,
  columns,
  variants: {
    kpiStrip: {
      // Claves calculadas por el backend sobre el conjunto filtrado completo.
      cards: [
        { key: 'cursos',       label: 'Cursos',          color: 'info' },
        { key: 'totalHombres', label: 'Hombres',         color: 'info' },
        { key: 'totalMujeres', label: 'Mujeres',         color: 'accent' },
        { key: 'totalGeneral', label: 'Total matrícula', color: 'success' },
        { key: 'pctMujeres',   label: '% Mujeres',       color: 'warning', format: 'percent' },
      ],
    },
    chart: {
      kind: 'groupedBar',
      title: 'Matrícula por área técnica',
      subtitle: 'Hombres y mujeres por área (las 10 con más matrícula)',
      xKey: 'areaTecnica',
      xLabel: 'Área técnica',
      yLabel: 'Estudiantes',
      series: [
        { key: 'hombres', label: 'Hombres', color: 'info' },
        { key: 'mujeres', label: 'Mujeres', color: 'primary' },
      ],
      // Las filas que recibe el gráfico ya no incluyen subtotales.
      data: (rows: R1Row[]) => {
        const byArea = new Map<string, { areaTecnica: string; hombres: number; mujeres: number }>();
        for (const r of rows) {
          const acc = byArea.get(r.areaTecnica) ?? { areaTecnica: r.areaTecnica, hombres: 0, mujeres: 0 };
          acc.hombres += r.hombres ?? 0;
          acc.mujeres += r.mujeres ?? 0;
          byArea.set(r.areaTecnica, acc);
        }
        return Array.from(byArea.values())
          .sort((a, b) => (b.hombres + b.mujeres) - (a.hombres + a.mujeres))
          .slice(0, 10);
      },
    },
  },
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  // El backend devuelve todas las filas (con subtotales): la tabla pagina en el cliente.
  fetcher: async (filters) => {
    const res = await apiGet<{ rows: R1Row[]; total: number; totals?: Record<string, number>; kpis?: Record<string, number> }>(
      '/reports/r1-matricula-cftp',
      queryParams(r1Definition.filters, filters as Record<string, unknown>),
    );
    return { rows: res.rows, total: res.total, totalsRow: res.totals, kpis: res.kpis };
  },
};

registerReport(r1Definition);
