import { DollarSign, TrendingDown, Users, Contact } from 'lucide-react';
import type { ReportDefinition, ReportCategory } from './types';

export interface ReportCategoryMeta {
  key: ReportCategory;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentDestructive?: boolean;
}

export const REPORT_CATEGORIES: ReportCategoryMeta[] = [
  {
    key: 'ingresos',
    label: 'Ingresos',
    description: 'Financiamiento, donaciones y ejecución',
    icon: DollarSign,
  },
  {
    key: 'egresos',
    label: 'Egresos',
    description: 'Gastos operativos, overhead y presupuesto',
    icon: TrendingDown,
  },
  {
    key: 'estudiantes',
    label: 'Estudiantes',
    description: 'Matrícula, retención y seguimiento post-formación',
    icon: Users,
  },
  {
    key: 'directorios',
    label: 'Directorios',
    description: 'Empresas, donantes y plantillas institucionales',
    icon: Contact,
  },
];

const _registry = new Map<string, ReportDefinition<any, any>>();

export function registerReport(def: ReportDefinition<any, any>) {
  _registry.set(def.id, def);
}

export function getReport(id: string): ReportDefinition<any, any> | undefined {
  return _registry.get(id);
}

export function allReports(): ReportDefinition<any, any>[] {
  return Array.from(_registry.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export function reportsByCategory(key: ReportCategory): ReportDefinition<any, any>[] {
  return allReports().filter((r) => r.category === key);
}
