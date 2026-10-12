// Catálogos del módulo de egresados y seguimiento.
// Espejo de caderh-backend/src/utils/egresados-catalogos.js: los CÓDIGOS se
// guardan en la base (CHECK de la migración 1772360000000); las etiquetas son
// lo que ve el usuario. Si cambia uno, cambie el otro.

export type ResultadoCierre = 'EGRESADO' | 'DESERTOR';
export type MotivoDesercion = 'DESINTERES' | 'ECONOMICO' | 'MIGRACION' | 'DOMICILIO' | 'OTRO';
export type ResultadoPasantia = 'EN_CURSO' | 'COMPLETADA' | 'DESERTO';
export type EstatusSeguimiento =
  | 'TRABAJO_PERMANENTE' | 'TRABAJO_TEMPORAL' | 'EMPRENDIENDO' | 'ESTUDIANDO'
  | 'BUSQUEDA_EMPLEO' | 'EN_PASANTIA' | 'OTRO' | 'NO_APLICA';
export type GrupoEstatus =
  | 'TRABAJANDO' | 'EMPRENDIENDO' | 'ESTUDIANDO' | 'BUSQUEDA_EMPLEO' | 'EN_PASANTIA' | 'OTRO' | 'SIN_SEGUIMIENTO';

export const RESULTADOS: Record<ResultadoCierre, string> = {
  EGRESADO: 'Egresó',
  DESERTOR: 'Desertó',
};

export const MOTIVOS_DESERCION: Record<MotivoDesercion, string> = {
  DESINTERES: 'Falta de interés o decisión personal',
  ECONOMICO: 'Falta de dinero',
  MIGRACION: 'Migró o viajó',
  DOMICILIO: 'Cambio de domicilio',
  OTRO: 'Otro',
};

export const RESULTADOS_PASANTIA: Record<ResultadoPasantia, string> = {
  EN_CURSO: 'En curso',
  COMPLETADA: 'Completada',
  DESERTO: 'Desertó',
};

export const ESTATUS_SEGUIMIENTO: Record<EstatusSeguimiento, string> = {
  TRABAJO_PERMANENTE: 'Trabajo permanente',
  TRABAJO_TEMPORAL: 'Trabajo temporal',
  EMPRENDIENDO: 'Emprendiendo',
  ESTUDIANDO: 'Estudiando',
  BUSQUEDA_EMPLEO: 'Búsqueda de empleo',
  EN_PASANTIA: 'En pasantía',
  OTRO: 'Otro',
  NO_APLICA: 'No aplica',
};

export const GRUPO_ESTATUS: Record<EstatusSeguimiento, Exclude<GrupoEstatus, 'SIN_SEGUIMIENTO'>> = {
  TRABAJO_PERMANENTE: 'TRABAJANDO',
  TRABAJO_TEMPORAL: 'TRABAJANDO',
  EMPRENDIENDO: 'EMPRENDIENDO',
  ESTUDIANDO: 'ESTUDIANDO',
  BUSQUEDA_EMPLEO: 'BUSQUEDA_EMPLEO',
  EN_PASANTIA: 'EN_PASANTIA',
  OTRO: 'OTRO',
  NO_APLICA: 'OTRO',
};

export const GRUPOS_ESTATUS: Record<GrupoEstatus, string> = {
  TRABAJANDO: 'Trabajando',
  EMPRENDIENDO: 'Emprendiendo',
  ESTUDIANDO: 'Estudiando',
  BUSQUEDA_EMPLEO: 'Búsqueda de empleo',
  EN_PASANTIA: 'En pasantía',
  OTRO: 'Otro / no aplica',
  SIN_SEGUIMIENTO: 'Sin seguimiento',
};

export const RANGOS_INGRESO = [
  'Menos de L 3,000',
  'L 3,000 a L 5,000',
  'L 5,000 a L 8,000',
  'L 8,000 a L 12,000',
  'L 12,000 a L 15,000',
  'L 15,000 a L 20,000',
  'Más de L 20,000',
];

/** Qué detalle se captura según el estatus del corte. */
export function detallePorEstatus(estatus: EstatusSeguimiento | '' | null | undefined): 'empleo' | 'emprendimiento' | 'estudio' | null {
  if (estatus === 'TRABAJO_PERMANENTE' || estatus === 'TRABAJO_TEMPORAL') return 'empleo';
  if (estatus === 'EMPRENDIENDO') return 'emprendimiento';
  if (estatus === 'ESTUDIANDO') return 'estudio';
  return null;
}

export const asOptions = <K extends string>(map: Record<K, string>) =>
  (Object.entries(map) as Array<[K, string]>).map(([value, label]) => ({ value, label }));
