import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R1Filters {
  project?: string[];
  cftp?: string[];
  year?: number;
}

export interface R1Row {
  proyecto: string;
  ciudad: string;
  centroId: number;
  centro: string;
  curso: string;
  areaTecnica: string;
  hombres: number;
  mujeres: number;
  formacionNormal: number;
  formacionDual: number;
  total: number;
}

const columns: ColumnDef<R1Row>[] = [
  { key: 'proyecto',        label: 'Proyecto',      align: 'left',  render: (r: R1Row) => r.proyecto },
  { key: 'ciudad',          label: 'Ciudad/Zona',   align: 'left',  render: (r: R1Row) => r.ciudad },
  { key: 'centro',          label: 'Centro (CFTP)', align: 'left',  render: (r: R1Row) => r.centro },
  { key: 'curso',           label: 'Curso',         align: 'left',  render: (r: R1Row) => r.curso },
  { key: 'areaTecnica',     label: 'Área técnica',  align: 'left',  render: (r: R1Row) => r.areaTecnica },
  { key: 'hombres',         label: 'Hombres',       align: 'right', render: (r: R1Row) => String(r.hombres) },
  { key: 'mujeres',         label: 'Mujeres',       align: 'right', render: (r: R1Row) => String(r.mujeres) },
  { key: 'formacionNormal', label: 'F. Normal',     align: 'right', render: (r: R1Row) => String(r.formacionNormal) },
  { key: 'formacionDual',   label: 'F. Dual',       align: 'right', render: (r: R1Row) => String(r.formacionDual) },
  { key: 'total',           label: 'Total',         align: 'right', render: (r: R1Row) => String(r.total) },
];

export const r1Definition: ReportDefinition<R1Filters, R1Row> = {
  id: 'r1-matricula-cftp',
  code: 'R1',
  category: 'estudiantes',
  title: 'Consolidado matrícula por CFTP',
  subtitle: 'Jerárquico: Ciudad → Centro → Curso, con subtotales',
  filters: ['project', 'cftp', 'year'],
  defaultFilters: { year: new Date().getFullYear() },
  columns,
  variants: {
    hierarchical: {
      levels: ['ciudad', 'centro'],
    },
  },
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters, pagination) => {
    const page = pagination?.offset !== undefined && pagination?.limit
      ? Math.floor(pagination.offset / pagination.limit) + 1
      : 1;
    const pageSize = pagination?.limit ?? 25;
    const res = await apiGet<{ rows: R1Row[]; total: number }>(
      '/reports/r1-matricula-cftp',
      {
        project: filters.project?.join(','),
        cftp: filters.cftp?.join(','),
        year: filters.year,
        page,
        page_size: pageSize,
      },
    );
    return { rows: res.rows, total: res.total };
  },
};

registerReport(r1Definition);
