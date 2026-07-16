'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ReportBreadcrumbs, type Crumb } from '../table/report-breadcrumbs';
import { ReportHeader } from '../table/report-header';
import { ReportEmpty } from '../table/report-empty';
import { ReportError } from '../table/report-error';
import { ScopeBar } from '../filters/scope-bar';
import { FilterDrawer } from '../filters/filter-drawer';
import { ExportMenu } from '../export/export-menu';
import { MissingDbBanner, type MissingDbItem } from '../missing-db/missing-db-banner';
import { SHOW_PENDING_HINTS } from '@/lib/report/pending-hints';
import { CompoundHeader } from '../variants/compound-header';
import { ConditionalRedCell } from '../variants/conditional-red-cell';
import { ReportChart } from '../variants/report-chart';
import { ReportKpiStrip } from '../variants/report-kpi-strip';
import { ReportSkeleton } from './report-skeleton';
import { useReportQuery } from '@/hooks/use-report-query';
import { useReportExport } from '@/hooks/use-report-export';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { FILTER_META } from '@/lib/report/filter-keys';
import type { AnyColumn, ColumnDef, CompoundColumnDef, ReportDefinition, Pagination } from '@/lib/report/types';

const EXTRA_LABELS: Record<string, string> = {
  from:    'Desde',
  to:      'Hasta',
  estatus: 'Estado',
};

function chipLabel(key: string, value: unknown): string {
  const meta = (FILTER_META as Record<string, any>)[key];
  const label = meta?.label ?? EXTRA_LABELS[key] ?? key;
  const formatted = meta?.formatValue
    ? meta.formatValue(value)
    : Array.isArray(value)
      ? value.join(', ')
      : String(value ?? '');
  return `${label}: ${formatted}`;
}

function flatten<TRow>(cols: AnyColumn<TRow>[]): ColumnDef<TRow>[] {
  return cols.flatMap((c) => ('group' in c ? (c as CompoundColumnDef<TRow>).children : [c as ColumnDef<TRow>]));
}

/** Valor de celda considerado "vacío" para efectos de `hideIfEmpty`. */
function isEmptyCell(v: unknown): boolean {
  return v == null || v === '' || v === '—';
}

/**
 * Filtra columnas marcadas con `hideIfEmpty` cuando TODAS las filas de la
 * página actual traen valor vacío para su key. Los grupos compuestos filtran
 * sus hijas y desaparecen si quedan sin ninguna.
 */
function visibleOnly<TRow>(cols: AnyColumn<TRow>[], rows: TRow[]): AnyColumn<TRow>[] {
  const keep = (c: ColumnDef<TRow>) =>
    !c.hideIfEmpty || rows.length === 0 || rows.some((r) => !isEmptyCell((r as any)[c.key]));
  return cols
    .map((c) =>
      'group' in c
        ? ({ ...c, children: (c as CompoundColumnDef<TRow>).children.filter(keep) } as AnyColumn<TRow>)
        : c
    )
    .filter((c) => ('group' in c ? (c as CompoundColumnDef<TRow>).children.length > 0 : keep(c as ColumnDef<TRow>)));
}

export interface ReportTableShellProps<TFilters extends Record<string, any>, TRow> {
  definition: ReportDefinition<TFilters, TRow>;
  breadcrumbs: Crumb[];
  renderFilters: (
    filters: TFilters,
    setFilter: <K extends keyof TFilters>(k: K, v: TFilters[K]) => void
  ) => React.ReactNode;
  aboveTable?: React.ReactNode;
}

const PAGE_SIZE = 25;

export function ReportTableShell<TFilters extends Record<string, any>, TRow>({
  definition, breadcrumbs, renderFilters, aboveTable,
}: ReportTableShellProps<TFilters, TRow>) {
  const defaults = (definition.defaultFilters ?? {}) as TFilters;
  const { filters, setFilter, clearAll } = useUrlFilters<TFilters>(defaults);
  const [page, setPage] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pagination: Pagination = { offset: page * PAGE_SIZE, limit: PAGE_SIZE };
  const query = useReportQuery(definition, filters, pagination);

  const flatCols = useMemo(() => flatten(definition.columns), [definition.columns]);

  // Columnas realmente visibles: excluye las `hideIfEmpty` cuando toda la
  // página actual viene vacía para esa key (header, celdas y totales).
  const visibleColumns = useMemo(
    () => visibleOnly(definition.columns, query.data?.rows ?? []),
    [definition.columns, query.data?.rows]
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

  const hasData = !!query.data && query.data.rows.length > 0;

  const activeCount = Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null).length;
  const chips = Object.entries(filters)
    .filter(([, v]) => v !== '' && v !== undefined && v !== null)
    .map(([k, v]) => ({ key: k, label: chipLabel(k, v) }));

  const { doExport, busy } = useReportExport(definition, filters, query.data?.rows ?? [], flatCols);

  return (
    <div className="mb-4">
      <ReportBreadcrumbs crumbs={breadcrumbs} />
      <ReportHeader
        title={`${definition.code} · ${definition.title}`}
        subtitle={definition.subtitle}
        onClear={clearAll}
        exportMenu={<ExportMenu disabled={busy || !query.isSuccess} onExport={doExport} />}
      />

      <ScopeBar
        activeCount={activeCount}
        chips={chips}
        onOpen={() => setDrawerOpen(true)}
        onRemove={(k) => setFilter(k as any, '' as any)}
        onClearAll={clearAll}
      />

      <FilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onApply={() => setDrawerOpen(false)}
        onClearAll={() => { clearAll(); setDrawerOpen(false); }}
        activeCount={activeCount}
      >
        {renderFilters(filters, setFilter)}
      </FilterDrawer>

      {SHOW_PENDING_HINTS && <MissingDbBanner missing={missing} />}

      {aboveTable}

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
          rows={query.data!.rows}
          captureId={`chart-${definition.id}`}
        />
      )}

      <Card className="p-6">
        <CardContent className="p-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">
              Resultados{' '}
              <span className="text-muted-foreground font-normal text-sm">
                {query.isSuccess ? `· ${query.data!.total} registros` : ''}
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
                onClear={clearAll}
                pendingNote={definition.pendingModule}
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
                      {query.data!.rows.map((row, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i, 20) * 0.015, duration: 0.18 }}
                          className="border-b border-border hover:bg-primary/5 transition-colors duration-200"
                        >
                          {visibleFlatCols.map((c) => {
                            const isRed = definition.variants?.conditionalRed?.when(row) === true
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
                                  {c.render ? c.render(row) : String((row as any)[c.key] ?? '')}
                                </ConditionalRedCell>
                              );
                            }
                            return (
                              <td key={c.key} className={`px-3 py-2 text-${c.align ?? 'left'} tabular-nums`}>
                                {c.render ? c.render(row) : String((row as any)[c.key] ?? '')}
                              </td>
                            );
                          })}
                        </motion.tr>
                      ))}
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
                              // Formatea el total con el mismo render de la columna
                              // (moneda, %, etc.); si truena, cae al valor crudo.
                              try {
                                content = c.render ? c.render(totalsRow as any) : String(raw);
                              } catch {
                                content = String(raw);
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

          {query.isSuccess && query.data!.total > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, query.data!.total)} de {query.data!.total}</span>
              <div className="flex gap-1">
                <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border border-border rounded disabled:opacity-40 hover:bg-primary/5 hover:border-primary/20 transition-colors">‹</button>
                <button disabled={(page + 1) * PAGE_SIZE >= query.data!.total} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border border-border rounded disabled:opacity-40 hover:bg-primary/5 hover:border-primary/20 transition-colors">›</button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
