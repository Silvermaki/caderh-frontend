import type { FilterKey, FilterGroup } from './types';

export interface FilterGroupDef {
  key: FilterGroup;
  label: string;
}

export interface FilterMeta {
  key: FilterKey;
  label: string;
  group: FilterGroup;
  control: 'multi-select' | 'date-range' | 'number-range' | 'select';
  dependsOn?: FilterKey;
}

export const FILTER_GROUPS: FilterGroupDef[] = [
  { key: 'periodo',      label: 'Período' },
  { key: 'contexto',     label: 'Contexto' },
  { key: 'demografia',   label: 'Demografía' },
  { key: 'ubicacion',    label: 'Ubicación' },
  { key: 'programatico', label: 'Programático' },
];

export const FILTER_META: Record<FilterKey, FilterMeta> = {
  dateRange:     { key: 'dateRange',     label: 'Rango de fechas',   group: 'periodo',      control: 'date-range' },
  year:          { key: 'year',          label: 'Año',               group: 'periodo',      control: 'select' },
  quarter:       { key: 'quarter',       label: 'Trimestre',         group: 'periodo',      control: 'multi-select' },
  project:       { key: 'project',       label: 'Proyecto',          group: 'contexto',     control: 'multi-select' },
  cftp:          { key: 'cftp',          label: 'CFTP',              group: 'contexto',     control: 'multi-select', dependsOn: 'project' },
  course:        { key: 'course',        label: 'Curso',             group: 'contexto',     control: 'multi-select', dependsOn: 'cftp' },
  gender:        { key: 'gender',        label: 'Género',            group: 'demografia',   control: 'multi-select' },
  age:           { key: 'age',           label: 'Edad',              group: 'demografia',   control: 'number-range' },
  youthStatus:   { key: 'youthStatus',   label: 'Estatus del joven', group: 'demografia',   control: 'multi-select' },
  department:    { key: 'department',    label: 'Departamento',      group: 'ubicacion',    control: 'multi-select' },
  municipality:  { key: 'municipality',  label: 'Municipio',         group: 'ubicacion',    control: 'multi-select', dependsOn: 'department' },
  city:          { key: 'city',          label: 'Ciudad / Zona',     group: 'ubicacion',    control: 'multi-select', dependsOn: 'municipality' },
  technicalArea: { key: 'technicalArea', label: 'Área técnica',      group: 'programatico', control: 'multi-select' },
  trainingType:  { key: 'trainingType',  label: 'Tipo capacitación', group: 'programatico', control: 'multi-select' },
  modality:      { key: 'modality',      label: 'Modalidad',         group: 'programatico', control: 'multi-select' },
};

export function filtersByGroup(keys: FilterKey[]): Record<FilterGroup, FilterKey[]> {
  const out: Record<FilterGroup, FilterKey[]> = {
    periodo: [], contexto: [], demografia: [], ubicacion: [], programatico: [],
  };
  for (const k of keys) {
    out[FILTER_META[k].group].push(k);
  }
  return out;
}
