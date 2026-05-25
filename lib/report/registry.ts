import { DollarSign, TrendingDown, Users, Contact } from 'lucide-react';
import type { ReportDefinition, ReportCategory } from './types';

export interface ReportCategoryMeta {
  key: ReportCategory;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentDestructive?: boolean;
}

// Categories are ordered so that listing reports per-category yields R1→R11
// in sequence: Estudiantes (R1-R5) → Ingresos (R6, R7) → Egresos (R8, R9) →
// Directorios (R10, R11). Don't reorder without checking the numbering.
export const REPORT_CATEGORIES: ReportCategoryMeta[] = [
  {
    key: 'estudiantes',
    label: 'Estudiantes',
    description: 'Matrícula, retención y seguimiento post-formación',
    icon: Users,
  },
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

// Extract the numeric part of an R-code so 'R2' < 'R10' (lexicographic sort
// would put 'R10' before 'R2'). Falls back to a high sentinel if the code
// doesn't follow the R# convention.
function reportCodeNumber(code: string): number {
  const m = /^R(\d+)/i.exec(code);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

export function allReports(): ReportDefinition<any, any>[] {
  return Array.from(_registry.values()).sort(
    (a, b) => reportCodeNumber(a.code) - reportCodeNumber(b.code),
  );
}

export function reportsByCategory(key: ReportCategory): ReportDefinition<any, any>[] {
  return allReports().filter((r) => r.category === key);
}
