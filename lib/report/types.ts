import type { ReactNode } from 'react';

export type ReportCategory =
  | 'ingresos'
  | 'egresos'
  | 'estudiantes'
  | 'directorios';

export type FilterKey =
  | 'dateRange' | 'year' | 'quarter'
  | 'project' | 'cftp' | 'course' | 'financingSource'
  | 'gender' | 'age' | 'youthStatus'
  | 'department' | 'municipality' | 'city'
  | 'technicalArea' | 'trainingType' | 'modality';

export type FilterGroup = 'periodo' | 'contexto' | 'demografia' | 'ubicacion' | 'programatico';

export interface ColumnDef<TRow> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  rowspan?: 1 | 2;
  render?: (row: TRow) => ReactNode;
  missingInDb?: boolean;
  missingNote?: string;
  plannedSource?: string;
  /**
   * Oculta la columna (header + celdas) cuando TODAS las filas de la página
   * actual traen valor nulo/vacío/'—' para esta key. Útil para columnas como
   * "Proyecto" que casi siempre vienen vacías y confunden a los revisores.
   */
  hideIfEmpty?: boolean;
}

export interface CompoundColumnDef<TRow> {
  group: string;
  children: ColumnDef<TRow>[];
}

export type AnyColumn<TRow> = ColumnDef<TRow> | CompoundColumnDef<TRow>;

export interface TotalSpec {
  key: string;
  kind: 'sum' | 'avg' | 'percent' | 'derived';
  derive?: (totals: Record<string, number>) => number;
}

/**
 * Formato de valor para las tarjetas KPI:
 * 'money' → L 1,234.56 · 'percent' → 12.3% · 'count' (default) → 1,234.
 */
export type KpiFormat = 'money' | 'percent' | 'count';

export interface KpiStripSpec {
  cards: Array<{
    /** Clave dentro de `kpis` que devuelve el backend del reporte. */
    key: string;
    label: string;
    color: 'info' | 'success' | 'accent' | 'destructive' | 'warning';
    format?: KpiFormat;
  }>;
}

export interface ConditionalRedSpec<TRow> {
  when: (row: TRow) => boolean;
  cells: string[];
}

export interface HierarchicalSpec {
  levels: string[];
}

export type ChartKind = 'bar' | 'groupedBar' | 'stackedBar' | 'donut' | 'line';

export interface ChartSeries {
  key: string;
  label: string;
  color?: 'primary' | 'success' | 'info' | 'warning' | 'destructive';
}

export interface ChartSpec<TRow = any> {
  kind: ChartKind;
  title: string;
  subtitle?: string;
  height?: number;
  /** Function to derive chart data from current rows. */
  data: (rows: TRow[]) => Array<Record<string, any>>;
  /** Field name in the derived data used as X axis (or label for donut). */
  xKey: string;
  /** Título del eje X (qué se mide horizontalmente). No aplica a donut. */
  xLabel?: string;
  /** Título del eje Y (qué se mide verticalmente). No aplica a donut. */
  yLabel?: string;
  /** Series definitions — for bar/line each is a series; for donut, the first one is the value. */
  series: ChartSeries[];
  /** Optional value formatter for tooltips/labels. */
  valueFormat?: (n: number) => string;
}

export interface Pagination {
  offset: number;
  limit: number;
  sort?: Array<{ key: string; dir: 'asc' | 'desc' }>;
}

export interface Page<TRow> {
  rows: TRow[];
  total: number;
  totalsRow?: Record<string, number | string | null>;
  /** KPIs agregados que calcula el backend (claves según `variants.kpiStrip.cards`). */
  kpis?: Record<string, number>;
}

export interface ReportDefinition<TFilters, TRow> {
  id: string;
  code: string;
  category: ReportCategory;
  title: string;
  subtitle: string;
  /**
   * Reporte stub: el módulo del que depende aún no existe. Cuando está
   * definido, el estado vacío explica la dependencia en lugar de sugerir
   * "limpiar filtros" (que aquí no ayudaría).
   */
  pendingModule?: string;

  filters: FilterKey[];
  defaultFilters?: Partial<TFilters>;

  columns: AnyColumn<TRow>[];
  totals?: TotalSpec[];

  variants?: {
    kpiStrip?: KpiStripSpec;
    conditionalRed?: ConditionalRedSpec<TRow>;
    compoundHeaders?: true;
    hierarchical?: HierarchicalSpec;
    chart?: ChartSpec<TRow>;
  };

  fetcher: (filters: TFilters, pagination: Pagination) => Promise<Page<TRow>>;

  export?: {
    excel?: 'client' | 'server';
    pdf?: 'server';
    csv?: 'client';
  };
}
