import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R2Filters { project?: string[]; cftp?: string[]; }

// Column notes (schema-verified against migrations):
//   telefono_celular ← DB column `celular` (aliased in SQL)
//   con_quien_vive   ← DB column `vive`   (aliased in SQL)
//   discapacidad     ← DB column `discapacidad_id` TEXT (aliased in SQL)
//   tiene_hijos      ← DB column INTEGER (0/1)
//   trabajo_actual, estudia, autoempleo ← DB column INTEGER (0/1)
export interface R2Row {
  num: number;
  centro: string;
  curso: string;
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

const str = (v: unknown) => (v == null || v === '' ? '—' : String(v));

const columns: ColumnDef<R2Row>[] = [
  { key: 'num',              label: '#',              align: 'right', render: (r: R2Row) => String(r.num) },
  { key: 'centro',           label: 'Centro',         align: 'left',  render: (r: R2Row) => str(r.centro) },
  { key: 'curso',            label: 'Curso',          align: 'left',  render: (r: R2Row) => str(r.curso) },
  { key: 'nombre_completo',  label: 'Nombre',         align: 'left',  render: (r: R2Row) => str(r.nombre_completo) },
  { key: 'dni',              label: 'DNI',            align: 'left',  render: (r: R2Row) => str(r.dni) },
  { key: 'edad',             label: 'Edad',           align: 'right', render: (r: R2Row) => str(r.edad) },
  { key: 'sexo',             label: 'Sexo',           align: 'left',  render: (r: R2Row) => str(r.sexo) },
  { key: 'estado_civil',     label: 'Est. civil',     align: 'left',  render: (r: R2Row) => str(r.estado_civil) },
  { key: 'telefono_celular', label: 'Teléfono',       align: 'left',  render: (r: R2Row) => str(r.telefono_celular) },
  { key: 'correo',           label: 'Correo',         align: 'left',  render: (r: R2Row) => str(r.correo) },
  { key: 'departamento',     label: 'Depto.',         align: 'left',  render: (r: R2Row) => str(r.departamento) },
  { key: 'direccion',        label: 'Dirección',      align: 'left',  render: (r: R2Row) => str(r.direccion) },
  { key: 'con_quien_vive',   label: 'Con quién vive', align: 'left',  render: (r: R2Row) => str(r.con_quien_vive) },
  { key: 'tiene_hijos',      label: 'Tiene hijos',    align: 'left',  render: (r: R2Row) => (r.tiene_hijos ? 'Sí' : 'No') },
  { key: 'discapacidad',     label: 'Discap.',        align: 'left',  render: (r: R2Row) => str(r.discapacidad) },
  { key: 'trabajo_actual',   label: 'Trabaja',        align: 'left',  render: (r: R2Row) => (r.trabajo_actual ? 'Sí' : 'No') },
  { key: 'donde_trabaja',    label: 'Empresa',        align: 'left',  render: (r: R2Row) => str(r.donde_trabaja) },
  { key: 'estudia',          label: 'Estudia',        align: 'left',  render: (r: R2Row) => (r.estudia ? 'Sí' : 'No') },
  { key: 'autoempleo',       label: 'Autoempleo',     align: 'left',  render: (r: R2Row) => (r.autoempleo ? 'Sí' : 'No') },
  // missingInDb columns — seguimiento post-formación no está en DB aún:
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
  subtitle: 'Tabla plana con datos personales y formativos',
  filters: ['project', 'cftp'],
  defaultFilters: {},
  columns,
  export: { excel: 'server', pdf: 'server', csv: 'client' },
  fetcher: async (filters, pagination) => {
    // pagination is {offset, limit} per types.ts
    const page = Math.floor((pagination?.offset ?? 0) / (pagination?.limit ?? 25)) + 1;
    const page_size = pagination?.limit ?? 25;
    const res = await apiGet<{ rows: R2Row[]; total: number; meta?: unknown }>(
      '/reports/r2-listado-jovenes',
      {
        project: filters.project?.join(','),
        cftp: filters.cftp?.join(','),
        page,
        page_size,
      },
    );
    return { rows: res.rows, total: res.total };
  },
};

registerReport(r2Definition);
