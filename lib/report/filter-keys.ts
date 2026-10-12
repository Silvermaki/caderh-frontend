import type { FilterKey, FilterGroup } from './types';

export interface FilterGroupDef {
  key: FilterGroup;
  label: string;
}

export interface FilterMeta {
  key: FilterKey;
  label: string;
  group: FilterGroup;
  control: 'multi-select' | 'date-range' | 'number-range' | 'select' | 'date';
  dependsOn?: FilterKey;
  formatValue?: (v: unknown) => string;
}

export const FILTER_GROUPS: FilterGroupDef[] = [
  { key: 'periodo',      label: 'Período' },
  { key: 'contexto',     label: 'Contexto' },
  { key: 'demografia',   label: 'Demografía' },
  { key: 'resultados',   label: 'Resultados' },
  { key: 'ubicacion',    label: 'Ubicación' },
  { key: 'programatico', label: 'Programático' },
];

export const FILTER_META: Record<FilterKey, FilterMeta> = {
  dateRange:     {
    key: 'dateRange', label: 'Rango de fechas', group: 'periodo', control: 'date-range',
    formatValue: (v: any) =>
      v?.from && v?.to ? `${v.from} → ${v.to}` : v?.from ? String(v.from) : String(v ?? ''),
  },
  year:          { key: 'year',          label: 'Año',               group: 'periodo',      control: 'select' },
  quarter:       { key: 'quarter',       label: 'Trimestre',         group: 'periodo',      control: 'select' },
  cutoffDate:    { key: 'cutoffDate',    label: 'Fecha de corte',    group: 'periodo',      control: 'date' },
  project:       { key: 'project',       label: 'Proyecto',          group: 'contexto',     control: 'multi-select' },
  cftp:           { key: 'cftp',           label: 'Centro de formación', group: 'contexto',   control: 'multi-select' },
  course:         { key: 'course',         label: 'Curso',             group: 'contexto',     control: 'multi-select', dependsOn: 'cftp' },
  financingSource:{ key: 'financingSource',label: 'Fuente de financiamiento', group: 'contexto', control: 'multi-select' },
  gender:        { key: 'gender',        label: 'Género',            group: 'demografia',   control: 'multi-select' },
  age:           {
    key: 'age', label: 'Edad', group: 'demografia', control: 'number-range',
    formatValue: (v: any) =>
      v?.min != null && v?.max != null ? `${v.min}–${v.max}` : String(v ?? ''),
  },
  youthStatus:   { key: 'youthStatus',   label: 'Estatus de seguimiento', group: 'resultados', control: 'multi-select' },
  courseResult:  { key: 'courseResult',  label: 'Resultado del curso', group: 'resultados', control: 'multi-select' },
  department:    { key: 'department',    label: 'Departamento',      group: 'ubicacion',    control: 'multi-select' },
  municipality:  { key: 'municipality',  label: 'Municipio',         group: 'ubicacion',    control: 'multi-select', dependsOn: 'department' },
  city:          { key: 'city',          label: 'Ciudad del curso',  group: 'ubicacion',    control: 'multi-select', dependsOn: 'municipality' },
  technicalArea: { key: 'technicalArea', label: 'Área técnica',      group: 'programatico', control: 'multi-select' },
  trainingType:  { key: 'trainingType',  label: 'Tipo capacitación', group: 'programatico', control: 'multi-select' },
  modality:      { key: 'modality',      label: 'Modalidad',         group: 'programatico', control: 'multi-select' },
};

export function filtersByGroup(keys: FilterKey[]): Record<FilterGroup, FilterKey[]> {
  const out: Record<FilterGroup, FilterKey[]> = {
    periodo: [], contexto: [], demografia: [], resultados: [], ubicacion: [], programatico: [],
  };
  for (const k of keys) {
    out[FILTER_META[k].group].push(k);
  }
  return out;
}

// ─── Parámetros de URL de cada filtro ───────────────────────────────────────
// Cada FilterKey se guarda en la URL con uno o más parámetros. La lista define
// qué se lee de la URL y con qué tipo: antes el hook solo leía las claves que
// traía `defaultFilters` (en la práctica, el año) y el resto de filtros nunca
// llegaba al backend.

export type ParamKind = 'array' | 'number' | 'string';

export interface FilterParam {
  name: string;
  kind: ParamKind;
  /** Etiqueta del chip cuando un filtro usa varios parámetros. */
  label: string;
}

export const FILTER_PARAMS: Record<FilterKey, FilterParam[]> = {
  dateRange: [
    { name: 'from', kind: 'string', label: 'Desde' },
    { name: 'to', kind: 'string', label: 'Hasta' },
  ],
  year: [{ name: 'year', kind: 'number', label: 'Año' }],
  quarter: [{ name: 'quarter', kind: 'string', label: 'Trimestre' }],
  cutoffDate: [{ name: 'corte', kind: 'string', label: 'Fecha de corte' }],
  project: [{ name: 'project', kind: 'array', label: 'Proyecto' }],
  cftp: [{ name: 'cftp', kind: 'array', label: 'Centro' }],
  course: [{ name: 'course', kind: 'array', label: 'Curso' }],
  financingSource: [{ name: 'financingSource', kind: 'array', label: 'Fuente' }],
  gender: [{ name: 'gender', kind: 'array', label: 'Género' }],
  age: [
    { name: 'age_min', kind: 'number', label: 'Edad desde' },
    { name: 'age_max', kind: 'number', label: 'Edad hasta' },
  ],
  youthStatus: [{ name: 'estatus', kind: 'array', label: 'Estatus' }],
  courseResult: [{ name: 'resultado', kind: 'array', label: 'Resultado' }],
  department: [{ name: 'department', kind: 'array', label: 'Departamento' }],
  municipality: [{ name: 'municipality', kind: 'array', label: 'Municipio' }],
  city: [{ name: 'city', kind: 'array', label: 'Ciudad' }],
  technicalArea: [{ name: 'technicalArea', kind: 'array', label: 'Área técnica' }],
  trainingType: [{ name: 'trainingType', kind: 'array', label: 'Tipo capacitación' }],
  modality: [{ name: 'modality', kind: 'array', label: 'Modalidad' }],
};

/** Parámetros de URL (nombre → definición) de un conjunto de filtros. */
export function paramsFor(keys: FilterKey[]): Map<string, FilterParam> {
  const map = new Map<string, FilterParam>();
  for (const k of keys) for (const p of FILTER_PARAMS[k] ?? []) map.set(p.name, p);
  return map;
}

/** Valor crudo de la URL → valor tipado. '' (vacío explícito) → undefined. */
export function parseParamValue(raw: string, kind: ParamKind): unknown {
  if (raw === '') return undefined;
  if (kind === 'array') {
    const arr = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return arr.length ? arr : undefined;
  }
  if (kind === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  return raw;
}

/** Valor tipado → texto de URL. Vacío (undefined, '', []) → null. */
export function serializeParamValue(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (Array.isArray(value)) return value.length ? value.map(String).join(',') : null;
  return String(value);
}

/**
 * Filtros de un reporte → parámetros de la consulta al backend (mismos
 * nombres que en la URL; listas separadas por coma). Solo los declarados: el
 * PDF del backend repite la consulta con este mismo objeto de filtros.
 */
export function queryParams(
  keys: FilterKey[],
  filters: Record<string, unknown>,
): Record<string, string | number | undefined> {
  const out: Record<string, string | number | undefined> = {};
  for (const name of paramsFor(keys).keys()) {
    const v = filters[name];
    const text = serializeParamValue(v);
    if (text !== null) out[name] = typeof v === 'number' ? v : text;
  }
  return out;
}

/** Fecha 'YYYY-MM-DD' → '31/12/2026' (para chips y resúmenes). */
export function formatIsoDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Hoy (fecha local) como 'YYYY-MM-DD'. */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Año en curso como rango del 1/1 al 31/12 (default de los reportes por período). */
export function currentYearRange(): { from: string; to: string } {
  const y = new Date().getFullYear();
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}
