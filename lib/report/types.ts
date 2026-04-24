import type { ReactNode } from 'react';

export type ReportCategory =
  | 'ingresos'
  | 'egresos'
  | 'estudiantes'
  | 'directorios';

export type FilterKey =
  | 'dateRange' | 'year' | 'quarter'
  | 'project' | 'cftp' | 'course'
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

export interface KpiStripSpec {
  cards: Array<{
    key: string;
    label: string;
    color: 'info' | 'success' | 'accent' | 'destructive' | 'warning';
    compute: (rows: any[]) => number;
    stateFilter?: string;
  }>;
}

export interface ConditionalRedSpec<TRow> {
  when: (row: TRow) => boolean;
  cells: string[];
}

export interface HierarchicalSpec {
  levels: string[];
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
}

export interface ReportDefinition<TFilters, TRow> {
  id: string;
  code: string;
  category: ReportCategory;
  title: string;
  subtitle: string;

  filters: FilterKey[];
  defaultFilters?: Partial<TFilters>;

  columns: AnyColumn<TRow>[];
  totals?: TotalSpec[];

  variants?: {
    kpiStrip?: KpiStripSpec;
    conditionalRed?: ConditionalRedSpec<TRow>;
    compoundHeaders?: true;
    hierarchical?: HierarchicalSpec;
  };

  fetcher: (filters: TFilters, pagination: Pagination) => Promise<Page<TRow>>;

  export?: {
    excel?: 'client' | 'server';
    pdf?: 'server';
    csv?: 'client';
  };
}
