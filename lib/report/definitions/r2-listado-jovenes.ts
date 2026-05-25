import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R2Filters {
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

export interface R2Row {
  num: number;
  centro: string;
  ciudad: string | null;
  curso: string;
  areaTecnica?: string | null;
  area_tecnica?: string | null;
  anio: number | null;
  trimestre: number | null;
  nombre_completo: string;
  dni: string;
  fecha_nacimiento: string | null;
  edad: number | null;
  sexo: string | null;
  estado_civil: string | null;
  telefono_celular: string | null;
  correo: string | null;
  departamento: string | null;
  direccion: string | null;
  con_quien_vive: string | null;
  tiene_hijos: number | null;
  discapacidad: string | null;
  trabajo_actual: number | null;
  donde_trabaja: string | null;
  estudia: number | null;
  autoempleo: number | null;
}

const QUARTER_LABEL: Record<number, string> = { 1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4' };
const str = (v: unknown) => (v == null || v === '' ? '—' : String(v));

const columns: ColumnDef<R2Row>[] = [
  { key: 'num',              label: '#',              align: 'right', render: (r) => String(r.num) },
  { key: 'centro',           label: 'Centro',         align: 'left',  render: (r) => str(r.centro) },
  { key: 'ciudad',           label: 'Ciudad/Zona',    align: 'left',  render: (r) => str(r.ciudad) },
  { key: 'curso',            label: 'Curso',          align: 'left',  render: (r) => str(r.curso) },
  { key: 'area_tecnica',     label: 'Área técnica',   align: 'left',  render: (r) => str(r.area_tecnica) },
  { key: 'anio',             label: 'Año',            align: 'right', render: (r) => r.anio != null ? String(r.anio) : '—' },
  { key: 'trimestre',        label: 'Trimestre',      align: 'right', render: (r) => r.trimestre != null ? (QUARTER_LABEL[r.trimestre] ?? String(r.trimestre)) : '—' },
  { key: 'nombre_completo',  label: 'Nombre',         align: 'left',  render: (r) => str(r.nombre_completo) },
  { key: 'dni',              label: 'DNI',            align: 'left',  render: (r) => str(r.dni) },
  { key: 'edad',             label: 'Edad',           align: 'right', render: (r) => str(r.edad) },
  { key: 'sexo',             label: 'Sexo',           align: 'left',  render: (r) => str(r.sexo) },
  { key: 'estado_civil',     label: 'Est. civil',     align: 'left',  render: (r) => str(r.estado_civil) },
  { key: 'telefono_celular', label: 'Teléfono',       align: 'left',  render: (r) => str(r.telefono_celular) },
  { key: 'correo',           label: 'Correo',         align: 'left',  render: (r) => str(r.correo) },
  { key: 'departamento',     label: 'Depto.',         align: 'left',  render: (r) => str(r.departamento) },
  { key: 'direccion',        label: 'Dirección',      align: 'left',  render: (r) => str(r.direccion) },
  { key: 'con_quien_vive',   label: 'Con quién vive', align: 'left',  render: (r) => str(r.con_quien_vive) },
  { key: 'tiene_hijos',      label: 'Tiene hijos',    align: 'left',  render: (r) => (r.tiene_hijos ? 'Sí' : 'No') },
  { key: 'discapacidad',     label: 'Discap.',        align: 'left',  render: (r) => str(r.discapacidad) },
  { key: 'trabajo_actual',   label: 'Trabaja',        align: 'left',  render: (r) => (r.trabajo_actual ? 'Sí' : 'No') },
  { key: 'donde_trabaja',    label: 'Empresa',        align: 'left',  render: (r) => str(r.donde_trabaja) },
  { key: 'estudia',          label: 'Estudia',        align: 'left',  render: (r) => (r.estudia ? 'Sí' : 'No') },
  { key: 'autoempleo',       label: 'Autoempleo',     align: 'left',  render: (r) => (r.autoempleo ? 'Sí' : 'No') },
  {
    key: 'migranteRetornado', label: 'Migrante retornado', align: 'left',
    missingInDb: true, missingNote: 'Campo no existe en tabla estudiantes',
    render: () => '—',
  } as any,
  {
    key: 'tipoContratacion', label: 'Tipo contratación', align: 'left',
    missingInDb: true, missingNote: 'Módulo seguimiento pendiente',
    render: () => '—',
  } as any,
  {
    key: 'puestoActual', label: 'Puesto', align: 'left',
    missingInDb: true, missingNote: 'Módulo seguimiento pendiente',
    render: () => '—',
  } as any,
  {
    key: 'rangoSalario', label: 'Rango salario', align: 'left',
    missingInDb: true, missingNote: 'Módulo seguimiento pendiente',
    render: () => '—',
  } as any,
  {
    key: 'nombreEmprendimiento', label: 'Emprendimiento', align: 'left',
    missingInDb: true, missingNote: 'Módulo seguimiento pendiente',
    render: () => '—',
  } as any,
  {
    key: 'rubroEmprendimiento', label: 'Rubro emprendimiento', align: 'left',
    missingInDb: true, missingNote: 'Módulo seguimiento pendiente',
    render: () => '—',
  } as any,
  {
    key: 'ingresoMensualFamiliar', label: 'Ingreso familiar', align: 'left',
    missingInDb: true, missingNote: 'Campo no existe en tabla estudiantes',
    render: () => '—',
  } as any,
];

export const r2Definition: ReportDefinition<R2Filters, R2Row> = {
  id: 'r2-listado-jovenes',
  code: 'R2',
  category: 'estudiantes',
  title: 'Listado detallado de jóvenes',
  subtitle: 'Tabla plana con filtros por año, trimestre, edad y contexto',
  filters: [
    'year', 'quarter',
    'project', 'cftp', 'financingSource',
    'gender', 'age',
    'city',
    'technicalArea',
  ],
  defaultFilters: { year: new Date().getFullYear() },
  columns,
  variants: {
    kpiStrip: {
      cards: [
        {
          key: 'totalRegistros',
          label: 'Total registros',
          color: 'info',
          compute: (rows: R2Row[]) => rows.length,
        },
      ],
    },
  },
  export: { excel: 'server', pdf: 'server', csv: 'client' },
  fetcher: async (filters, pagination) => {
    const page = Math.floor((pagination?.offset ?? 0) / (pagination?.limit ?? 25)) + 1;
    const page_size = pagination?.limit ?? 25;
    const res = await apiGet<{ rows: R2Row[]; total: number; meta?: unknown }>(
      '/reports/r2-listado-jovenes',
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
        page_size,
      },
    );
    return { rows: res.rows, total: res.total };
  },
};

registerReport(r2Definition);
