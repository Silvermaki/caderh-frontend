import type { ReportDefinition, ReportCategory } from './types';

export interface ReportCategoryMeta {
  key: ReportCategory;
  label: string;
  description: string;
  accentDestructive?: boolean;
}

export const REPORT_CATEGORIES: ReportCategoryMeta[] = [
  { key: 'estudiantes',   label: 'Estudiantes y matrícula',   description: 'Matrícula, jerarquía, jóvenes' },
  { key: 'seguimiento',   label: 'Seguimiento y movimiento',  description: 'Activos, deserción, avance' },
  { key: 'ingresos',      label: 'Ingresos y financiamiento', description: 'Ejecución presupuestaria' },
  { key: 'egresos',       label: 'Egresos y gastos',          description: 'Gasto operativo y overhead' },
  { key: 'catalogos',     label: 'Catálogos operativos',      description: 'Cursos, instructores, CFTP' },
  { key: 'institucional', label: 'Institucional',             description: 'AC-R-022 y plantillas oficiales', accentDestructive: true },
];

const _registry = new Map<string, ReportDefinition<any, any>>();

export function registerReport(def: ReportDefinition<any, any>) {
  _registry.set(def.id, def);
}

export function getReport(id: string): ReportDefinition<any, any> | undefined {
  return _registry.get(id);
}

export function allReports(): ReportDefinition<any, any>[] {
  return Array.from(_registry.values());
}

export function reportsByCategory(cat: ReportCategory): ReportDefinition<any, any>[] {
  return allReports().filter((r) => r.category === cat);
}
