// Opciones fijas de los filtros y catálogo de cada parámetro: las usan el
// panel de filtros y las etiquetas de los chips de la barra de alcance.
import type { CatalogKey } from '@/hooks/use-filter-catalog';
import { GRUPOS_ESTATUS, asOptions } from '@/lib/egresados-catalogos';

export interface Option {
  value: string;
  label: string;
}

export const GENDER_OPTIONS: Option[] = [
  { value: 'M', label: 'Hombres' },
  { value: 'F', label: 'Mujeres' },
];

export const QUARTER_OPTIONS: Option[] = [
  { value: 'Q1', label: 'Q1 (Enero–Marzo)' },
  { value: 'Q2', label: 'Q2 (Abril–Junio)' },
  { value: 'Q3', label: 'Q3 (Julio–Septiembre)' },
  { value: 'Q4', label: 'Q4 (Octubre–Diciembre)' },
];

// Resultado del curso (cierre de la matrícula).
export const COURSE_RESULT_OPTIONS: Option[] = [
  { value: 'EGRESADO', label: 'Egresó' },
  { value: 'DESERTOR', label: 'Desertó' },
  { value: 'SIN_CIERRE', label: 'Sin cierre (curso terminado)' },
  { value: 'EN_CURSO', label: 'Curso en marcha' },
];

// Estatus de seguimiento agrupado (como los cuadros del cliente).
export const YOUTH_STATUS_OPTIONS: Option[] = asOptions(GRUPOS_ESTATUS);

/** Opciones fijas por parámetro de URL. */
export const STATIC_OPTIONS: Record<string, Option[]> = {
  gender: GENDER_OPTIONS,
  quarter: QUARTER_OPTIONS,
  resultado: COURSE_RESULT_OPTIONS,
  estatus: YOUTH_STATUS_OPTIONS,
};

/** Catálogo del backend de cada parámetro de URL que guarda IDs. */
export const PARAM_CATALOG: Record<string, CatalogKey> = {
  project: 'project',
  cftp: 'cftp',
  course: 'course',
  financingSource: 'financingSource',
  technicalArea: 'area',
  city: 'municipality',
  municipality: 'municipality',
  department: 'department',
};
