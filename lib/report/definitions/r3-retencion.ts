import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R3Filters {
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

export interface R3Row {
  proyecto: string;
  ciudad: string;
  centro: string;
  curso: string;
  areaTecnica: string;
  anio: number | null;
  trimestre: number | null;
  edad: number | null;
  hombresInicial: number;
  mujeresInicial: number;
  totalInicial: number;
  hombresFinal: number;
  mujeresFinal: number;
  totalFinal: number;
  desercion: number;
  pctRetencion: number;
}

const QUARTER_LABEL: Record<number, string> = { 1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4' };
const pct = (n: number) => `${n.toFixed(1)}%`;

const columns: ColumnDef<R3Row>[] = [
  { key: 'proyecto',       label: 'Proyecto',         align: 'left',  render: (r) => r.proyecto },
  { key: 'ciudad',         label: 'Ciudad/Zona',      align: 'left',  render: (r) => r.ciudad },
  { key: 'centro',         label: 'Centro (CFP)',     align: 'left',  render: (r) => r.centro },
  { key: 'curso',          label: 'Curso',            align: 'left',  render: (r) => r.curso },
  { key: 'areaTecnica',    label: 'Área técnica',     align: 'left',  render: (r) => r.areaTecnica },
  { key: 'anio',           label: 'Año',              align: 'right', render: (r) => r.anio != null ? String(r.anio) : '—' },
  { key: 'trimestre',      label: 'Trimestre',        align: 'right', render: (r) => r.trimestre != null ? (QUARTER_LABEL[r.trimestre] ?? String(r.trimestre)) : '—' },
  { key: 'edad',           label: 'Edad',             align: 'right', render: (r) => r.edad != null ? String(r.edad) : '—' },
  { key: 'hombresInicial', label: 'H inicial',        align: 'right', render: (r) => String(r.hombresInicial) },
  { key: 'mujeresInicial', label: 'M inicial',        align: 'right', render: (r) => String(r.mujeresInicial) },
  { key: 'totalInicial',   label: 'Total inicial',    align: 'right', render: (r) => String(r.totalInicial) },
  { key: 'hombresFinal',   label: 'H final',          align: 'right', render: (r) => String(r.hombresFinal) },
  { key: 'mujeresFinal',   label: 'M final',          align: 'right', render: (r) => String(r.mujeresFinal) },
  { key: 'totalFinal',     label: 'Total final',      align: 'right', render: (r) => String(r.totalFinal) },
  { key: 'desercion',      label: 'Deserción',        align: 'right', render: (r) => String(r.desercion) },
  { key: 'pctRetencion',   label: '% Retención',      align: 'right', render: (r) => pct(r.pctRetencion) },
];

export const r3Definition: ReportDefinition<R3Filters, R3Row> = {
  id: 'r3-retencion',
  code: 'R3',
  category: 'estudiantes',
  title: '% de retención',
  subtitle: 'Inicial vs egresados con segmentación año/trimestre/edad',
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
    { key: 'hombresInicial', kind: 'sum' },
    { key: 'mujeresInicial', kind: 'sum' },
    { key: 'totalInicial',   kind: 'sum' },
    { key: 'hombresFinal',   kind: 'sum' },
    { key: 'mujeresFinal',   kind: 'sum' },
    { key: 'totalFinal',     kind: 'sum' },
    { key: 'desercion',      kind: 'sum' },
    {
      key: 'pctRetencion',
      kind: 'derived',
      derive: (t: Record<string, number>) =>
        t.totalInicial > 0 ? Math.round((t.totalFinal / t.totalInicial) * 10000) / 100 : 0,
    },
  ],
  variants: {
    kpiStrip: {
      // Claves calculadas por el backend sobre el conjunto filtrado completo
      // (el backend expone `totalDesertados`, no `totalDesercion`).
      cards: [
        { key: 'totalInicial',       label: 'Total Inicial',   color: 'info' },
        { key: 'totalFinal',         label: 'Total Egresados', color: 'success' },
        { key: 'totalDesertados',    label: 'Total Deserción', color: 'destructive' },
        { key: 'pctRetencionGlobal', label: '% Retención',     color: 'accent', format: 'percent' },
      ],
    },
    chart: {
      kind: 'bar',
      title: '% de retención por proyecto',
      subtitle: 'Promedio de retención agregado por proyecto',
      xKey: 'proyecto',
      xLabel: 'Proyecto',
      yLabel: '% Retención',
      valueFormat: (v: number) => `${v.toFixed(1)}%`,
      series: [
        { key: 'pctRetencion', label: '% Retención', color: 'success' },
      ],
      data: (rows: R3Row[]) => {
        const byProj = new Map<string, { proyecto: string; ti: number; tf: number }>();
        for (const r of rows) {
          const key = r.proyecto || '—';
          const acc = byProj.get(key) ?? { proyecto: key, ti: 0, tf: 0 };
          acc.ti += r.totalInicial ?? 0;
          acc.tf += r.totalFinal ?? 0;
          byProj.set(key, acc);
        }
        return Array.from(byProj.values()).map((p) => ({
          proyecto: p.proyecto,
          pctRetencion: p.ti > 0 ? (p.tf / p.ti) * 100 : 0,
        })).sort((a, b) => b.pctRetencion - a.pctRetencion).slice(0, 10);
      },
    },
  },
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters, pagination) => {
    const page = pagination?.offset !== undefined && pagination?.limit
      ? Math.floor(pagination.offset / pagination.limit) + 1
      : 1;
    const pageSize = pagination?.limit ?? 25;
    const res = await apiGet<{ rows: R3Row[]; total: number; totals?: Record<string, number>; kpis?: Record<string, number> }>(
      '/reports/r3-retencion',
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

registerReport(r3Definition);
