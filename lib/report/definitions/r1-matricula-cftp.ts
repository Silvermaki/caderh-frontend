import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R1Filters {
  project?: string[];
  cftp?: string[];
  financingSource?: string[];
  technicalArea?: string[];
  city?: string[];
  year?: number;
  quarter?: string;
  age_min?: number;
  age_max?: number;
  gender?: string[];
}

export interface R1Row {
  proyecto: string;
  fuentes: string;
  ciudad: string;
  centroId: number;
  centro: string;
  curso: string;
  areaTecnica: string;
  anio: number | null;
  trimestre: number | null;
  edad: number | null;
  hombres: number;
  mujeres: number;
  formacionNormal: number;
  formacionDual: number;
  total: number;
}

const QUARTER_LABEL: Record<number, string> = { 1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4' };

const columns: ColumnDef<R1Row>[] = [
  // hideIfEmpty: casi todas las filas vienen sin proyecto vinculado ('—') y la
  // columna confundía a los revisores; se oculta si toda la página está vacía.
  { key: 'proyecto',        label: 'Proyecto',          align: 'left',  hideIfEmpty: true, render: (r) => r.proyecto },
  { key: 'fuentes',         label: 'Fuente(s) financiamiento', align: 'left', render: (r) => r.fuentes },
  { key: 'ciudad',          label: 'Ciudad/Zona',       align: 'left',  render: (r) => r.ciudad },
  { key: 'centro',          label: 'Centro (CFP)',      align: 'left',  render: (r) => r.centro },
  { key: 'curso',           label: 'Curso',             align: 'left',  render: (r) => r.curso },
  { key: 'areaTecnica',     label: 'Área técnica',      align: 'left',  render: (r) => r.areaTecnica },
  { key: 'anio',            label: 'Año',               align: 'right', render: (r) => r.anio != null ? String(r.anio) : '—' },
  { key: 'trimestre',       label: 'Trimestre',         align: 'right', render: (r) => r.trimestre != null ? (QUARTER_LABEL[r.trimestre] ?? String(r.trimestre)) : '—' },
  { key: 'edad',            label: 'Edad',              align: 'right', render: (r) => r.edad != null ? String(r.edad) : '—' },
  { key: 'hombres',         label: 'Hombres',           align: 'right', render: (r) => String(r.hombres) },
  { key: 'mujeres',         label: 'Mujeres',           align: 'right', render: (r) => String(r.mujeres) },
  { key: 'formacionNormal', label: 'F. Normal',         align: 'right', render: (r) => String(r.formacionNormal) },
  { key: 'formacionDual',   label: 'F. Dual',           align: 'right', render: (r) => String(r.formacionDual) },
  { key: 'total',           label: 'Total',             align: 'right', render: (r) => String(r.total) },
];

export const r1Definition: ReportDefinition<R1Filters, R1Row> = {
  id: 'r1-matricula-cftp',
  code: 'R1',
  category: 'estudiantes',
  title: 'Consolidado matrícula por CFP',
  subtitle: 'Pivot por ciudad / centro / curso / año / trimestre / edad',
  filters: [
    'year', 'quarter',
    'project', 'cftp', 'financingSource',
    'gender', 'age',
    'city',
    'technicalArea',
  ],
  defaultFilters: { year: new Date().getFullYear() },
  columns,
  totals: [
    { key: 'hombres',          kind: 'sum' },
    { key: 'mujeres',          kind: 'sum' },
    { key: 'formacionNormal',  kind: 'sum' },
    { key: 'formacionDual',    kind: 'sum' },
    { key: 'total',            kind: 'sum' },
  ],
  variants: {
    kpiStrip: {
      // Claves calculadas por el backend sobre el conjunto filtrado completo.
      cards: [
        { key: 'totalHombres', label: 'Total Hombres',   color: 'info' },
        { key: 'totalMujeres', label: 'Total Mujeres',   color: 'accent' },
        { key: 'totalGeneral', label: 'Total Matrícula', color: 'success' },
      ],
    },
    chart: {
      kind: 'groupedBar',
      title: 'Matrícula por área técnica',
      subtitle: 'Hombres vs mujeres agregados por área',
      xKey: 'areaTecnica',
      xLabel: 'Área técnica',
      yLabel: 'Estudiantes',
      series: [
        { key: 'hombres', label: 'Hombres', color: 'info' },
        { key: 'mujeres', label: 'Mujeres', color: 'primary' },
      ],
      data: (rows: R1Row[]) => {
        const byArea = new Map<string, { areaTecnica: string; hombres: number; mujeres: number }>();
        for (const r of rows) {
          const key = r.areaTecnica || '—';
          const acc = byArea.get(key) ?? { areaTecnica: key, hombres: 0, mujeres: 0 };
          acc.hombres += r.hombres ?? 0;
          acc.mujeres += r.mujeres ?? 0;
          byArea.set(key, acc);
        }
        return Array.from(byArea.values()).sort((a, b) => (b.hombres + b.mujeres) - (a.hombres + a.mujeres)).slice(0, 10);
      },
    },
  },
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters, pagination) => {
    const page = pagination?.offset !== undefined && pagination?.limit
      ? Math.floor(pagination.offset / pagination.limit) + 1
      : 1;
    const pageSize = pagination?.limit ?? 25;
    const res = await apiGet<{ rows: R1Row[]; total: number; totals?: Record<string, number>; kpis?: Record<string, number> }>(
      '/reports/r1-matricula-cftp',
      {
        project: filters.project?.join(','),
        cftp: filters.cftp?.join(','),
        financingSource: filters.financingSource?.join(','),
        technicalArea: filters.technicalArea?.join(','),
        city: filters.city?.join(','),
        year: filters.year,
        quarter: filters.quarter,
        age_min: filters.age_min,
        age_max: filters.age_max,
        gender: filters.gender?.join(','),
        page,
        page_size: pageSize,
      },
    );
    return { rows: res.rows, total: res.total, totalsRow: res.totals, kpis: res.kpis };
  },
};

registerReport(r1Definition);
