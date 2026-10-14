import type { ReactNode } from 'react';

export type ReportCategory =
  | 'ingresos'
  | 'egresos'
  | 'estudiantes'
  | 'directorios';

export type FilterKey =
  | 'dateRange' | 'year' | 'quarter' | 'cutoffDate'
  | 'project' | 'cftp' | 'course' | 'financingSource'
  | 'gender' | 'age' | 'youthStatus' | 'courseResult'
  | 'department' | 'municipality' | 'city'
  | 'technicalArea' | 'trainingType' | 'modality';

/**
 * Formato explícito de una columna para tabla y exportaciones. Sin él, las
 * exportaciones lo infieren por el nombre de la key (con falsos positivos:
 * "total" de un conteo salía como moneda).
 */
export type ColumnFormat = 'money' | 'percent' | 'count' | 'year' | 'text' | 'date';

export type FilterGroup = 'periodo' | 'contexto' | 'demografia' | 'resultados' | 'ubicacion' | 'programatico';

export interface ColumnDef<TRow> {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  rowspan?: 1 | 2;
  render?: (row: TRow) => ReactNode;
  format?: ColumnFormat;
  /**
   * false = la columna no va en el PDF. En reportes anchos el PDF (A4
   * apaisado) lleva las columnas principales; Excel y CSV llevan todas.
   */
  pdf?: boolean;
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
  /**
   * Deriva los datos del gráfico de las filas cargadas. `ctx.kpis` trae los
   * KPIs del backend (útil cuando el gráfico debe ignorar un filtro de filas,
   * p. ej. la distribución por estatus de R4).
   */
  data: (rows: TRow[], ctx?: { kpis?: Record<string, number> }) => Array<Record<string, any>>;
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
  /** Exportación: pedir TODAS las filas del filtro (page_size=all). */
  all?: boolean;
  sort?: Array<{ key: string; dir: 'asc' | 'desc' }>;
}

export interface Page<TRow> {
  rows: TRow[];
  total: number;
  totalsRow?: Record<string, number | string | null>;
  /** KPIs agregados que calcula el backend (claves según `variants.kpiStrip.cards`). */
  kpis?: Record<string, number>;
  /** Datos adicionales del backend (p. ej. R4: si hay egresados en el sistema). */
  meta?: Record<string, unknown>;
}

/** Aviso para el usuario final sobre el origen o el estado de los datos. */
export interface DataNotice {
  title?: string;
  text: string;
  /** Enlace al módulo donde se registran esos datos. */
  action?: { label: string; href: string };
}

/**
 * Las filas con `rowKind: 'subtotal'` se pintan en negrita (tabla, Excel y
 * PDF); no cuentan para gráficos.
 */
export type RowKind = 'subtotal';

export interface ReportDefinition<TFilters, TRow> {
  id: string;
  code: string;
  category: ReportCategory;
  title: string;
  subtitle: string;
  /**
   * Reporte que todavía no tiene de dónde alimentarse: la página y el listado
   * lo marcan "Próximamente" y este texto dice qué mostrará. Lo lee el usuario
   * final: describir el reporte, no el estado del desarrollo.
   */
  comingSoon?: string;
  /**
   * Estado vacío propio cuando la causa no son los filtros (p. ej. R4 sin
   * egresados en el sistema). Con null se usa el genérico "No hay resultados
   * con estos filtros", que ofrece limpiarlos.
   */
  emptyState?: (page: Page<TRow>) => DataNotice | null;
  /** Aviso sobre los resultados cuando faltan datos por registrar (p. ej. cierres en R3). */
  notice?: (page: Page<TRow>) => DataNotice | null;

  filters: FilterKey[];
  /**
   * Etiqueta/ayuda propia de un filtro en este reporte (p. ej. el rango de
   * fechas de R1 filtra por inicio del curso y el de R4 define la cohorte).
   */
  filterLabels?: Partial<Record<FilterKey, { label?: string; description?: string }>>;
  /** Valores iniciales; una función se evalúa al montar (p. ej. el año en curso). */
  defaultFilters?: Partial<TFilters> | (() => Partial<TFilters>);
  /**
   * true = el backend pagina (page/page_size). Si no, el backend devuelve
   * todas las filas y la tabla pagina en el cliente.
   */
  serverPagination?: boolean;

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
