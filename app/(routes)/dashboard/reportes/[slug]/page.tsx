'use client';

import '@/lib/report/demo-report';
import { notFound, useParams } from 'next/navigation';
import { getReport, REPORT_CATEGORIES } from '@/lib/report/registry';
import { ReportTableShell } from '@/components/report/shell/report-table-shell';
import { DateRangeField, MultiSelectField } from '@/components/report/filters/filter-controls';
import { FilterGroup } from '@/components/report/filters/filter-group';

export default function ReportSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const def = getReport(slug);
  if (!def) return notFound();

  const catMeta = REPORT_CATEGORIES.find((c) => c.key === def.category);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <ReportTableShell
        definition={def as any}
        breadcrumbs={[
          { label: 'Reportes', href: '/dashboard/reportes' },
          { label: catMeta?.label ?? def.category },
          { label: `${def.code} · ${def.title}` },
        ]}
        renderFilters={(filters: any, setFilter: any) => (
          <>
            {def.filters.includes('dateRange') && (
              <FilterGroup label="Período">
                <DateRangeField
                  label="Rango de fechas"
                  value={{
                    from: filters.from ? new Date(filters.from) : undefined,
                    to: filters.to ? new Date(filters.to) : undefined,
                  }}
                  onChange={(v) => {
                    setFilter('from', v.from ? v.from.toISOString().slice(0, 10) : '');
                    setFilter('to', v.to ? v.to.toISOString().slice(0, 10) : '');
                  }}
                />
              </FilterGroup>
            )}
            {def.filters.includes('project') && (
              <FilterGroup label="Contexto">
                <MultiSelectField
                  label="Proyecto"
                  value={filters.project ? [filters.project] : []}
                  onChange={(v) => setFilter('project', v[0] ?? '')}
                  options={[
                    { value: 'Tegucigalpa', label: 'Tegucigalpa' },
                    { value: 'San Pedro',   label: 'San Pedro Sula' },
                  ]}
                />
              </FilterGroup>
            )}
          </>
        )}
      />
    </div>
  );
}
