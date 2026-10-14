'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQueries } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReportBreadcrumbs, type Crumb } from '../table/report-breadcrumbs';
import { ReportHeader } from '../table/report-header';
import { ReportEmpty } from '../table/report-empty';
import { ReportError } from '../table/report-error';
import { ReportNotice } from '../table/report-notice';
import { ScopeBar } from '../filters/scope-bar';
import { FilterDrawer } from '../filters/filter-drawer';
import type { SetFilter, SetFilters } from '../filters/filter-renderer';
import { ExportMenu } from '../export/export-menu';
import { MissingDbBanner, type MissingDbItem } from '../missing-db/missing-db-banner';
import { SHOW_PENDING_HINTS } from '@/lib/report/pending-hints';
import { CompoundHeader } from '../variants/compound-header';
import { ConditionalRedCell } from '../variants/conditional-red-cell';
import { ReportChart } from '../variants/report-chart';
import { ReportKpiStrip } from '../variants/report-kpi-strip';
import { ReportSkeleton } from './report-skeleton';
import { ALL_ROWS, useReportQuery } from '@/hooks/use-report-query';
import { useReportExport } from '@/hooks/use-report-export';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { catalogOptions, catalogQueryOptions, type CatalogKey } from '@/hooks/use-filter-catalog';
import { FILTER_META, FILTER_PARAMS, formatIsoDate } from '@/lib/report/filter-keys';
import { PARAM_CATALOG, STATIC_OPTIONS } from '@/lib/report/filter-options';
import { columnFormat, formatValue } from '@/lib/report/format';
import { flatten, visibleOnly } from '@/lib/report/columns';
import type { ColumnDef, ReportDefinition, Pagination } from '@/lib/report/types';

const isSubtotal = (row: unknown) => (row as any)?.rowKind === 'subtotal';

const hasValue = (v: unknown) =>
  v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);

/** Filtro aplicado, como lo ven el usuario y las exportaciones. */
export interface AppliedFilter {
  key: string;
  /** Parámetros de URL que se limpian al quitar el chip. */
  params: string[];
  label: string;
  value: string;
}

function listText(ids: string[], labelOf: (id: string) => string): string {
  const names = ids.map(labelOf);
  return names.length <= 3 ? names.join(', ') : `${names.slice(0, 2).join(', ')} y ${names.length - 2} más`;
}

/**
 * Chips legibles de los filtros declarados por el reporte: nombres de
 * catálogo en vez de IDs, fechas dd/mm/aaaa y rangos en una sola pastilla.
 */
function useAppliedFilters(def: ReportDefinition<any, any>, filters: Record<string, any>): AppliedFilter[] {
  // Catálogos que hacen falta para nombrar los valores elegidos.
  const needed: CatalogKey[] = [];
  for (const k of def.filters) {
    for (const p of FILTER_PARAMS[k]) {
      const cat = PARAM_CATALOG[p.name];
      if (cat && hasValue(filters[p.name]) && !needed.includes(cat)) needed.push(cat);
    }
  }
  const results = useQueries({ queries: needed.map((k) => catalogQueryOptions(k)) });
  const names = new Map<CatalogKey, Map<string, string>>();
  needed.forEach((k, i) => {
    names.set(k, new Map(catalogOptions(k, results[i]?.data as any[] | undefined).map((o) => [o.value, o.label])));
  });

  const out: AppliedFilter[] = [];
  for (const k of def.filters) {
    const label = def.filterLabels?.[k]?.label ?? FILTER_META[k].label;
    if (k === 'dateRange') {
      const { from, to } = filters;
      if (!from && !to) continue;
      const value = from && to
        ? `${formatIsoDate(from)} – ${formatIsoDate(to)}`
        : from ? `desde ${formatIsoDate(from)}` : `hasta ${formatIsoDate(to)}`;
      out.push({ key: k, params: ['from', 'to'], label, value });
      continue;
    }
    if (k === 'age') {
      const { age_min: a, age_max: b } = filters;
      if (a == null && b == null) continue;
      const value = a != null && b != null ? `${a}–${b} años` : a != null ? `${a} años o más` : `hasta ${b} años`;
      out.push({ key: k, params: ['age_min', 'age_max'], label, value });
      continue;
    }
    for (const p of FILTER_PARAMS[k]) {
      const v = filters[p.name];
      if (!hasValue(v)) continue;
      const fixed = STATIC_OPTIONS[p.name];
      const cat = PARAM_CATALOG[p.name];
      const labelOf = (id: string) =>
        fixed?.find((o) => o.value === id)?.label ?? (cat ? names.get(cat)?.get(id) : undefined) ?? '…';
      let value: string;
      if (Array.isArray(v)) value = listText(v.map(String), labelOf);
      else if (k === 'cutoffDate') value = formatIsoDate(String(v));
      else if (fixed) value = labelOf(String(v));
      else value = String(v);
      out.push({ key: p.name, params: [p.name], label, value });
    }
  }
  return out;
}

export interface ReportTableShellProps<TFilters extends Record<string, any>, TRow> {
  definition: ReportDefinition<TFilters, TRow>;
  breadcrumbs: Crumb[];
  renderFilters: (filters: TFilters, setFilter: SetFilter, setFilters: SetFilters) => React.ReactNode;
  aboveTable?: React.ReactNode;
}

const SERVER_PAGE_SIZE = 25;
const CLIENT_PAGE_SIZE = 50;

export function ReportTableShell<TFilters extends Record<string, any>, TRow>({
  definition, breadcrumbs, renderFilters, aboveTable,
}: ReportTableShellProps<TFilters, TRow>) {
  const defaults = useMemo(() => {
    const d = definition.defaultFilters;
    return ((typeof d === 'function' ? d() : d) ?? {}) as TFilters;
  }, [definition]);
  const { filters, setFilter, setFilters, clearAll } = useUrlFilters<TFilters>(defaults, definition.filters);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Paginación: en el servidor (R2, miles de filas) o en el cliente sobre
  // todas las filas, que es lo que trae el backend de los demás reportes.
  const serverPaged = !!definition.serverPagination;
  const pageSize = serverPaged ? SERVER_PAGE_SIZE : CLIENT_PAGE_SIZE;
  const [page, setPage] = useState(0);
  const filtersKey = JSON.stringify(filters);
  useEffect(() => { setPage(0); }, [filtersKey]);

  const pagination: Pagination = serverPaged ? { offset: page * pageSize, limit: pageSize } : ALL_ROWS;
  const query = useReportQuery(definition, filters, pagination);

  const allRows = useMemo(() => query.data?.rows ?? [], [query.data?.rows]);
  const detailRows = useMemo(() => allRows.filter((r) => !isSubtotal(r)), [allRows]);
  const pageRows = serverPaged ? allRows : allRows.slice(page * pageSize, (page + 1) * pageSize);
  const totalCount = serverPaged ? (query.data?.total ?? 0) : allRows.length;
  const recordCount = serverPaged ? (query.data?.total ?? 0) : detailRows.length;

  const flatCols = useMemo(() => flatten(definition.columns), [definition.columns]);

  // Columnas realmente visibles: excluye las `hideIfEmpty` cuando todas las
  // filas cargadas vienen vacías para esa key (header, celdas y totales).
  const visibleColumns = useMemo(
    () => visibleOnly(definition.columns, allRows),
    [definition.columns, allRows]
  );
  const visibleFlatCols = useMemo(() => flatten(visibleColumns), [visibleColumns]);
  const missing: MissingDbItem[] = useMemo(
    () =>
      flatCols
        .filter((c) => c.missingInDb)
        .map((c) => ({
          key: c.key,
          label: c.label,
          source: c.plannedSource ?? '—',
          priority: 'med' as const,
        })),
    [flatCols]
  );

  const hasData = allRows.length > 0;
  const hasFilters = definition.filters.length > 0;
  const hasDefaults = Object.keys(defaults).length > 0;

  // Avisos sobre el origen de los datos (p. ej. cierres o seguimientos sin
  // registrar): sin ellos, una tabla vacía parecería un problema de filtros.
  const emptyNotice = query.data && !hasData ? definition.emptyState?.(query.data) ?? null : null;
  const notice = query.data && hasData ? definition.notice?.(query.data) ?? null : null;

  const applied = useAppliedFilters(definition, filters);
  const chips = applied.map((a) => ({ key: a.key, label: `${a.label}: ${a.value}` }));
  const removeChip = (key: string) => {
    const a = applied.find((x) => x.key === key);
    if (a) setFilters(Object.fromEntries(a.params.map((p) => [p, undefined])) as Partial<TFilters>);
  };

  const { doExport, busy } = useReportExport(definition, filters, applied);

  const renderCell = (c: ColumnDef<TRow>, row: TRow) => {
    if (c.render) return c.render(row);
    const v = (row as any)[c.key];
    // En los subtotales las celdas sin dato quedan en blanco (sin "—").
    if (isSubtotal(row) && (v == null || v === '')) return '';
    return formatValue(v, columnFormat(c));
  };

  return (
    <div className="mb-4">
      <ReportBreadcrumbs crumbs={breadcrumbs} />
      <ReportHeader
        title={`${definition.code} · ${definition.title}`}
        subtitle={definition.subtitle}
        onClear={hasFilters ? clearAll : undefined}
        exportMenu={<ExportMenu disabled={busy || !query.isSuccess || !hasData} onExport={doExport} />}
      />

      {hasFilters && (
        <>
          <ScopeBar
            activeCount={applied.length}
            chips={chips}
            onOpen={() => setDrawerOpen(true)}
            onRemove={removeChip}
            onClearAll={clearAll}
            clearLabel={hasDefaults ? 'Restablecer' : 'Limpiar todo'}
          />

          <FilterDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            onApply={() => setDrawerOpen(false)}
            onClearAll={() => { clearAll(); setDrawerOpen(false); }}
            activeCount={applied.length}
          >
            {renderFilters(filters, setFilter as unknown as SetFilter, setFilters as unknown as SetFilters)}
          </FilterDrawer>
        </>
      )}

      {SHOW_PENDING_HINTS && <MissingDbBanner missing={missing} />}

      {aboveTable}

      {notice && <ReportNotice notice={notice} />}

      {/* Tira de KPIs: solo si la definición la declara y el backend devolvió kpis. */}
      {definition.variants?.kpiStrip && query.data?.kpis && (
        <ReportKpiStrip
          cards={definition.variants.kpiStrip.cards}
          kpis={query.data.kpis}
        />
      )}

      {definition.variants?.chart && hasData && (
        <ReportChart
          spec={definition.variants.chart as any}
          rows={detailRows}
          kpis={query.data?.kpis}
          captureId={`chart-${definition.id}`}
        />
      )}

      <Card className="p-6">
        <CardContent className="p-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Resultados{' '}
              <span className="text-muted-foreground font-normal text-sm">
                {query.isSuccess ? `· ${recordCount.toLocaleString('es-HN')} registros` : ''}
              </span>
            </h3>
            <span className="text-xs text-muted-foreground">
              Columnas: <b>{visibleFlatCols.length}/{flatCols.length}</b> (fijas)
            </span>
          </div>

          <div className="overflow-hidden">
            {query.isLoading && !hasData && (
              <ReportSkeleton rows={10} cols={flatCols.length} />
            )}

            {query.isError && <ReportError onRetry={() => query.refetch()} />}

            {!query.isLoading && !query.isError && !hasData && (
              <ReportEmpty
                onClear={hasFilters ? clearAll : undefined}
                notice={emptyNotice}
                comingSoon={definition.comingSoon}
              />
            )}

            {hasData && (
              <div className="relative">
                {query.isFetching && (
                  <div className="absolute inset-0 z-10 bg-background/40 pointer-events-none" />
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <CompoundHeader columns={visibleColumns} />
                    <tbody>
                      {pageRows.map((row, i) => {
                        const subtotal = isSubtotal(row);
                        return (
                          <motion.tr
                            key={`${page}-${i}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i, 20) * 0.015, duration: 0.18 }}
                            className={cn(
                              'border-b border-border transition-colors duration-200',
                              subtotal ? 'bg-primary/5 font-semibold text-foreground' : 'hover:bg-primary/5'
                            )}
                          >
                            {visibleFlatCols.map((c) => {
                              const isRed = !subtotal
                                && definition.variants?.conditionalRed?.when(row) === true
                                && definition.variants.conditionalRed.cells.includes(c.key);
                              if (c.missingInDb) {
                                return (
                                  <td
                                    key={c.key}
                                    className={`px-3 py-2 text-${c.align ?? 'left'} text-muted-foreground${SHOW_PENDING_HINTS ? ' bg-warning/5' : ''}`}
                                  >
                                    —
                                  </td>
                                );
                              }
                              if (isRed) {
                                return (
                                  <ConditionalRedCell key={c.key} isRed>
                                    {renderCell(c, row)}
                                  </ConditionalRedCell>
                                );
                              }
                              return (
                                <td key={c.key} className={`px-3 py-2 text-${c.align ?? 'left'} tabular-nums`}>
                                  {renderCell(c, row)}
                                </td>
                              );
                            })}
                          </motion.tr>
                        );
                      })}
                    </tbody>
                    {query.data!.totalsRow && (
                      <tfoot className="sticky bottom-0 bg-card">
                        <tr className="font-semibold text-foreground">
                          {visibleFlatCols.map((c, colIdx) => {
                            const totalsRow = query.data!.totalsRow!;
                            const raw = totalsRow[c.key];
                            let content: React.ReactNode;
                            if (c.missingInDb) {
                              content = '—';
                            } else if (raw != null) {
                              // Formatea el total como la columna (moneda, %, etc.);
                              // si el render truena con la fila de totales, cae al formato.
                              try {
                                content = renderCell(c, totalsRow as any);
                              } catch {
                                content = formatValue(raw, columnFormat(c));
                              }
                            } else {
                              // La primera columna sin total actúa de etiqueta de la fila.
                              content = colIdx === 0 ? 'Total' : '';
                            }
                            return (
                              <td key={c.key} className={`px-3 py-3 text-${c.align ?? 'left'} tabular-nums border-t-2 border-border`}>
                                {content}
                              </td>
                            );
                          })}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>

          {query.isSuccess && totalCount > pageSize && (
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>
                Mostrando {(page * pageSize + 1).toLocaleString('es-HN')}–{Math.min((page + 1) * pageSize, totalCount).toLocaleString('es-HN')} de {totalCount.toLocaleString('es-HN')}
                {!serverPaged && totalCount !== recordCount ? ' filas (incluye subtotales)' : ''}
              </span>
              <div className="flex gap-1">
                <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border border-border rounded disabled:opacity-40 hover:bg-primary/5 hover:border-primary/20 transition-colors" aria-label="Página anterior">‹</button>
                <button disabled={(page + 1) * pageSize >= totalCount} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border border-border rounded disabled:opacity-40 hover:bg-primary/5 hover:border-primary/20 transition-colors" aria-label="Página siguiente">›</button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
