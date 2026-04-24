import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R4Filters { project?: string[]; estatus?: string; }
export interface R4Row {
  num: number;
  nombre_completo: string;
  dni: string;
  curso: string;
  centro: string;
  proyecto: string | null;
  estatus: string;
  donde_trabaja: string | null;
}

const columns: ColumnDef<R4Row>[] = [
  { key: 'num',             label: '#',               align: 'right', render: (r: R4Row) => String(r.num) },
  { key: 'nombre_completo', label: 'Nombre',          align: 'left',  render: (r: R4Row) => r.nombre_completo },
  { key: 'dni',             label: 'DNI',             align: 'left',  render: (r: R4Row) => r.dni },
  { key: 'curso',           label: 'Curso',           align: 'left',  render: (r: R4Row) => r.curso },
  { key: 'centro',          label: 'Centro',          align: 'left',  render: (r: R4Row) => r.centro },
  { key: 'proyecto',        label: 'Proyecto',        align: 'left',  render: (r: R4Row) => r.proyecto ?? '—' },
  { key: 'estatus',         label: 'Estatus',         align: 'left',  render: (r: R4Row) => r.estatus },
  { key: 'donde_trabaja',   label: 'Empresa / Lugar', align: 'left',  render: (r: R4Row) => r.donde_trabaja ?? '—' },
  { key: 'puesto',          label: 'Puesto',          align: 'left',
    missingInDb: true, missingNote: 'Módulo seguimiento pendiente', render: () => '—' } as any,
  { key: 'rangoSalario',    label: 'Rango salario',   align: 'left',
    missingInDb: true, missingNote: 'Módulo seguimiento pendiente', render: () => '—' } as any,
  { key: 'montoKit',        label: 'Monto kit',       align: 'right',
    missingInDb: true, missingNote: 'Campo no capturado aún',       render: () => '—' } as any,
];

export const r4Definition: ReportDefinition<R4Filters, R4Row> = {
  id: 'r4-seguimiento-post-formacion',
  code: 'R4',
  category: 'estudiantes',
  title: 'Seguimiento post-formación',
  subtitle: 'Pasantía · Trabajando · Emprendiendo · Estudiando',
  filters: ['project'],
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
  } as any,
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters, pagination) => {
    const page = Math.floor((pagination?.offset ?? 0) / (pagination?.limit ?? 25)) + 1;
    const page_size = pagination?.limit ?? 25;
    const res = await apiGet<{ rows: R4Row[]; total: number; kpis?: any; meta?: any }>(
      '/reports/r4-seguimiento-post-formacion',
      {
        project: filters.project?.join(','),
        estatus: filters.estatus,
        page,
        page_size,
      },
    );
    return { rows: res.rows, total: res.total, kpis: res.kpis, meta: res.meta };
  },
};

registerReport(r4Definition);
