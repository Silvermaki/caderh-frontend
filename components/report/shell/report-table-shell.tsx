'use client';

import { useState, useMemo } from 'react';
import { ReportBreadcrumbs, type Crumb } from '../table/report-breadcrumbs';
import { ReportHeader } from '../table/report-header';
import { ReportEmpty } from '../table/report-empty';
import { ReportError } from '../table/report-error';
import { ScopeBar } from '../filters/scope-bar';
import { FilterDrawer } from '../filters/filter-drawer';
import { ExportMenu } from '../export/export-menu';
import { MissingDbBanner, type MissingDbItem } from '../missing-db/missing-db-banner';
import { CompoundHeader } from '../variants/compound-header';
import { ConditionalRedCell } from '../variants/conditional-red-cell';
import { Skeleton } from '@/components/ui/skeleton';
import { useReportQuery } from '@/hooks/use-report-query';
import { useReportExport } from '@/hooks/use-report-export';
import { useUrlFilters } from '@/hooks/use-url-filters';
import type { AnyColumn, ColumnDef, CompoundColumnDef, ReportDefinition, Pagination } from '@/lib/report/types';

function flatten<TRow>(cols: AnyColumn<TRow>[]): ColumnDef<TRow>[] {
  return cols.flatMap((c) => ('group' in c ? (c as CompoundColumnDef<TRow>).children : [c as ColumnDef<TRow>]));
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

  const activeCount = Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null).length;
  const chips = Object.entries(filters)
    .filter(([, v]) => v !== '' && v !== undefined && v !== null)
    .map(([k, v]) => ({ key: k, label: `${k}: ${String(v)}` }));

  const { doExport, busy } = useReportExport(definition, filters, query.data?.rows ?? [], flatCols);

  return (
    <div>
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

      <MissingDbBanner missing={missing} />

      {aboveTable}

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <h3 className="text-sm font-semibold">
            Resultados{' '}
            <span className="text-muted-foreground font-normal">
              {query.isSuccess ? `· ${query.data.total} registros` : ''}
            </span>
          </h3>
          <span className="text-xs text-muted-foreground">Columnas: <b>{flatCols.length}/{flatCols.length}</b> (fijas)</span>
        </div>

        {query.isLoading && (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (<Skeleton key={i} className="h-6 w-full" />))}
          </div>
        )}

        {query.isError && <ReportError onRetry={() => query.refetch()} />}

        {query.isSuccess && query.data.rows.length === 0 && (
          <ReportEmpty onClear={clearAll} />
        )}

        {query.isSuccess && query.data.rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <CompoundHeader columns={definition.columns} />
              <tbody>
                {query.data.rows.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-muted/30">
                    {flatCols.map((c) => {
                      const isRed = definition.variants?.conditionalRed?.when(row) === true
                        && definition.variants.conditionalRed.cells.includes(c.key);
                      if (c.missingInDb) {
                        return (
                          <td key={c.key} className="px-2 py-1.5 text-right text-muted-foreground bg-amber-50/50">—</td>
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
                        <td key={c.key} className={`px-2 py-1.5 text-${c.align ?? 'left'} tabular-nums`}>
                          {c.render ? c.render(row) : String((row as any)[c.key] ?? '')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              {query.data.totalsRow && (
                <tfoot className="sticky bottom-0">
                  <tr className="bg-muted/40 font-bold">
                    {flatCols.map((c) => (
                      <td key={c.key} className={`px-2 py-2 text-${c.align ?? 'left'} tabular-nums border-t-2`}>
                        {c.missingInDb ? '—' : query.data.totalsRow?.[c.key] ?? ''}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {query.isSuccess && query.data.total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-3 py-2 border-t text-xs text-muted-foreground">
            <span>Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, query.data.total)} de {query.data.total}</span>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 border rounded disabled:opacity-40">‹</button>
              <button disabled={(page + 1) * PAGE_SIZE >= query.data.total} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 border rounded disabled:opacity-40">›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
