import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';
import { currentYearRange, queryParams } from '../filter-keys';

export interface R2Filters {
  from?: string;
  to?: string;
  project?: string[];
  financingSource?: string[];
  cftp?: string[];
  course?: string[];
  technicalArea?: string[];
  gender?: string[];
  age_min?: number;
  age_max?: number;
  resultado?: string[];
}

/** Una fila por matrícula (estudiante × curso). */
export interface R2Row {
  num: number;
  centro: string;
  curso: string;
  codigo_proceso: string;
  inicio: string;
  area_tecnica: string | null;
  proyectos: string | null;
  nombre_completo: string;
  dni: string;
  fecha_nacimiento: string | null;
  edad: number | null;
  sexo: string | null;
  estado_civil: string | null;
  celular: string | null;
  telefono_alternativo: string | null;
  correo: string | null;
  redes: string | null;
  departamento: string | null;
  municipio: string | null;
  direccion: string | null;
  con_quien_vive: string | null;
  dependientes: string | null;
  tiene_hijos: string;
  discapacidad: string | null;
  interno: string;
  nivel_educativo: string | null;
  estudia: string;
  trabaja: string;
  empresa: string | null;
  puesto: string | null;
  tipo_contrato: string | null;
  beneficios: string | null;
  emprendimiento: string | null;
  antiguedad_emprendimiento: string | null;
  ingreso_hogar: number | null;
  observaciones: string | null;
  resultado: string;
  estatus_seguimiento: string | null;
  fecha_seguimiento: string | null;
}

// Columnas = lo que captura el formulario del estudiante (el UI dicta qué
// campos están vigentes), más el resultado del curso y el último seguimiento.
// Los datos laborales son los declarados al INSCRIBIRSE.
const columns: ColumnDef<R2Row>[] = [
  { key: 'num',                       label: '#',                    align: 'right', format: 'count' },
  { key: 'centro',                    label: 'Centro',               align: 'left',  format: 'text' },
  { key: 'curso',                     label: 'Curso',                align: 'left',  format: 'text' },
  { key: 'codigo_proceso',            label: 'Código',               align: 'left',  format: 'text', pdf: false },
  { key: 'inicio',                    label: 'Inicio del curso',     align: 'left',  format: 'date' },
  { key: 'area_tecnica',              label: 'Área técnica',         align: 'left',  format: 'text', pdf: false },
  { key: 'proyectos',                 label: 'Proyecto(s)',          align: 'left',  format: 'text', pdf: false },
  { key: 'nombre_completo',           label: 'Nombre',               align: 'left',  format: 'text' },
  { key: 'dni',                       label: 'DNI',                  align: 'left',  format: 'text' },
  { key: 'fecha_nacimiento',          label: 'Fecha de nacimiento',  align: 'left',  format: 'date', pdf: false },
  { key: 'edad',                      label: 'Edad',                 align: 'right', format: 'count' },
  { key: 'sexo',                      label: 'Sexo',                 align: 'left',  format: 'text' },
  { key: 'estado_civil',              label: 'Estado civil',         align: 'left',  format: 'text', pdf: false },
  { key: 'celular',                   label: 'Celular',              align: 'left',  format: 'text' },
  { key: 'telefono_alternativo',      label: 'Contacto de referencia', align: 'left', format: 'text', pdf: false },
  { key: 'correo',                    label: 'Correo',               align: 'left',  format: 'text', pdf: false },
  { key: 'redes',                     label: 'Redes sociales',       align: 'left',  format: 'text', pdf: false },
  { key: 'departamento',              label: 'Departamento',         align: 'left',  format: 'text', pdf: false },
  { key: 'municipio',                 label: 'Municipio',            align: 'left',  format: 'text' },
  { key: 'direccion',                 label: 'Dirección',            align: 'left',  format: 'text', pdf: false },
  { key: 'con_quien_vive',            label: 'Con quién vive',       align: 'left',  format: 'text', pdf: false },
  { key: 'dependientes',              label: 'Dependientes',         align: 'left',  format: 'text', pdf: false },
  { key: 'tiene_hijos',               label: 'Tiene hijos',          align: 'left',  format: 'text', pdf: false },
  { key: 'discapacidad',              label: 'Discapacidad',         align: 'left',  format: 'text', pdf: false },
  { key: 'interno',                   label: 'Interno',              align: 'left',  format: 'text', pdf: false },
  { key: 'nivel_educativo',           label: 'Nivel educativo',      align: 'left',  format: 'text', pdf: false },
  { key: 'estudia',                   label: 'Estudia',              align: 'left',  format: 'text', pdf: false },
  { key: 'trabaja',                   label: 'Trabaja',              align: 'left',  format: 'text', pdf: false },
  { key: 'empresa',                   label: 'Empresa',              align: 'left',  format: 'text', pdf: false },
  { key: 'puesto',                    label: 'Puesto',               align: 'left',  format: 'text', pdf: false },
  { key: 'tipo_contrato',             label: 'Tipo de contrato',     align: 'left',  format: 'text', pdf: false },
  { key: 'beneficios',                label: 'Beneficios',           align: 'left',  format: 'text', pdf: false },
  { key: 'emprendimiento',            label: 'Emprendimiento',       align: 'left',  format: 'text', pdf: false },
  { key: 'antiguedad_emprendimiento', label: 'Antigüedad del emprendimiento', align: 'left', format: 'text', pdf: false },
  { key: 'ingreso_hogar',             label: 'Ingreso del hogar',    align: 'right', format: 'money', pdf: false },
  { key: 'observaciones',             label: 'Observaciones',        align: 'left',  format: 'text', pdf: false },
  { key: 'resultado',                 label: 'Resultado del curso',  align: 'left',  format: 'text' },
  { key: 'estatus_seguimiento',       label: 'Último seguimiento',   align: 'left',  format: 'text' },
  { key: 'fecha_seguimiento',         label: 'Fecha de seguimiento', align: 'left',  format: 'date', pdf: false },
  {
    key: 'migranteRetornado', label: 'Migrante retornado', align: 'left',
    missingInDb: true, missingNote: 'El formulario del estudiante no lo captura (pedido del listado 2023)',
    pdf: false,
  },
];

export const r2Definition: ReportDefinition<R2Filters, R2Row> = {
  id: 'r2-listado-jovenes',
  code: 'R2',
  category: 'estudiantes',
  title: 'Listado detallado de estudiantes',
  subtitle: 'Una fila por estudiante y curso: ficha del estudiante, resultado del curso y último seguimiento.',
  filters: ['dateRange', 'project', 'financingSource', 'cftp', 'course', 'technicalArea', 'gender', 'age', 'courseResult'],
  filterLabels: {
    dateRange: { label: 'Período', description: 'Cursos en marcha o terminados en este período.' },
    age: { description: 'Edad actual del estudiante.' },
    courseResult: { description: '"Sin cierre": el curso ya terminó y falta registrar si egresó o desertó.' },
  },
  defaultFilters: currentYearRange,
  serverPagination: true,
  columns,
  variants: {
    kpiStrip: {
      // totalRegistros lo calcula el backend sobre el total filtrado (no la página).
      cards: [
        { key: 'totalRegistros', label: 'Matrículas en el filtro', color: 'info' },
      ],
    },
  },
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters, pagination) => {
    const paging = pagination.all
      ? { page: 1, page_size: 'all' }
      : { page: Math.floor(pagination.offset / pagination.limit) + 1, page_size: pagination.limit };
    const res = await apiGet<{ rows: R2Row[]; total: number; kpis?: Record<string, number> }>(
      '/reports/r2-listado-jovenes',
      { ...queryParams(r2Definition.filters, filters as Record<string, unknown>), ...paging },
    );
    return { rows: res.rows, total: res.total, kpis: res.kpis };
  },
};

registerReport(r2Definition);
