import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R4Filters {
  project?: string[];
  cftp?: string[];
  financingSource?: string[];
  technicalArea?: string[];
  year?: number;
  estatus?: string;
}
export interface R4Row {
  num: number;
  nombre_completo: string;
  dni: string;
  curso: string;
  centro: string;
  proyecto: string | null;
  estatus: string;
  donde_trabaja: string | null;
  puesto: string | null;
  rangoSalario: string | null;
}

const columns: ColumnDef<R4Row>[] = [
  { key: 'num',             label: '#',               align: 'right', render: (r: R4Row) => String(r.num) },
  { key: 'nombre_completo', label: 'Nombre',          align: 'left',  render: (r: R4Row) => r.nombre_completo },
  { key: 'dni',             label: 'DNI',             align: 'left',  render: (r: R4Row) => r.dni },
  { key: 'curso',           label: 'Curso',           align: 'left',  render: (r: R4Row) => r.curso },
  { key: 'centro',          label: 'Centro',          align: 'left',  render: (r: R4Row) => r.centro },
  // hideIfEmpty: la mayoría de egresados no tiene proyecto vinculado ('—');
  // se oculta la columna si toda la página actual viene vacía.
  { key: 'proyecto',        label: 'Proyecto',        align: 'left',  hideIfEmpty: true, render: (r: R4Row) => r.proyecto ?? '—' },
  { key: 'estatus',         label: 'Estatus',         align: 'left',  render: (r: R4Row) => r.estatus },
  { key: 'donde_trabaja',   label: 'Empresa / Lugar', align: 'left',  render: (r: R4Row) => r.donde_trabaja ?? '—' },
  { key: 'puesto',          label: 'Puesto',          align: 'left',  render: (r: R4Row) => r.puesto ?? '—' },
  { key: 'rangoSalario',    label: 'Rango salario',   align: 'left',  render: (r: R4Row) => r.rangoSalario ?? '—' },
  { key: 'montoKit',        label: 'Monto kit',       align: 'right',
    missingInDb: true, missingNote: 'Campo no capturado aún',       render: () => '—' } as any,
];

export const r4Definition: ReportDefinition<R4Filters, R4Row> = {
  id: 'r4-seguimiento-post-formacion',
  code: 'R4',
  category: 'estudiantes',
  title: 'Seguimiento post-formación',
  subtitle: 'Pasantía · Trabajando · Emprendiendo · Estudiando',
  filters: ['year', 'project', 'cftp', 'financingSource', 'technicalArea'],
  defaultFilters: {},
  columns,
  variants: {
    kpiStrip: {
      cards: [
        { key: 'pasantia',     label: 'Pasantía',     color: 'info',    format: 'count' },
        { key: 'trabajando',   label: 'Trabajando',   color: 'success', format: 'count' },
        { key: 'emprendiendo', label: 'Emprendiendo', color: 'accent',  format: 'count' },
        { key: 'estudiando',   label: 'Estudiando',   color: 'warning', format: 'count' },
      ],
    },
  },
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters, pagination) => {
    const page = Math.floor((pagination?.offset ?? 0) / (pagination?.limit ?? 25)) + 1;
    const page_size = pagination?.limit ?? 25;
    const res = await apiGet<{ rows: R4Row[]; total: number; kpis?: Record<string, number>; meta?: any }>(
      '/reports/r4-seguimiento-post-formacion',
      {
        project: filters.project?.join(','),
        cftp: filters.cftp?.join(','),
        financingSource: filters.financingSource?.join(','),
        technicalArea: filters.technicalArea?.join(','),
        year: filters.year,
        estatus: filters.estatus,
        page,
        page_size,
      },
    );
    // El backend envía la fila cruda del SQL en snake_case (`rango_salario`);
    // se mapea a la key camelCase de la columna.
    const rows = res.rows.map((r: any) => ({
      ...r,
      rangoSalario: r.rangoSalario ?? r.rango_salario ?? null,
    }));
    return { rows, total: res.total, kpis: res.kpis, meta: res.meta };
  },
};

registerReport(r4Definition);
