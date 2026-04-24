'use client';
import type { ReportDefinition } from '@/lib/report/types';
import { FilterGroup } from './filter-group';
import { DateRangeField, MultiSelectField, SingleSelectField } from './filter-controls';
import { useFilterCatalog } from '@/hooks/use-filter-catalog';
import { FILTER_META } from '@/lib/report/filter-keys';

interface FiltersInput {
  filters: any;
  setFilter: (k: string, v: any) => void;
  def: ReportDefinition<any, any>;
}

function ProjectField({ filters, setFilter }: FiltersInput) {
  const { options } = useFilterCatalog('project');
  return (
    <MultiSelectField
      label={FILTER_META.project.label}
      value={filters.project ?? []}
      onChange={(v) => setFilter('project', v)}
      options={options}
    />
  );
}

function CftpField({ filters, setFilter }: FiltersInput) {
  const { options } = useFilterCatalog('cftp');
  return (
    <MultiSelectField
      label={FILTER_META.cftp.label}
      value={filters.cftp ?? []}
      onChange={(v) => setFilter('cftp', v)}
      options={options}
    />
  );
}

function YearField({ filters, setFilter }: FiltersInput) {
  const current = new Date().getFullYear();
  const options = Array.from({ length: 5 }).map((_, i) => {
    const y = current - i;
    return { value: String(y), label: String(y) };
  });
  return (
    <SingleSelectField
      label={FILTER_META.year.label}
      value={filters.year ? String(filters.year) : ''}
      onChange={(v) => setFilter('year', v ? Number(v) : undefined)}
      options={options}
    />
  );
}

function QuarterField({ filters, setFilter }: FiltersInput) {
  return (
    <SingleSelectField
      label={FILTER_META.quarter.label}
      value={filters.quarter ?? ''}
      onChange={(v) => setFilter('quarter', v)}
      options={[
        { value: 'Q1', label: 'Q1 (Enero–Marzo)' },
        { value: 'Q2', label: 'Q2 (Abril–Junio)' },
        { value: 'Q3', label: 'Q3 (Julio–Septiembre)' },
        { value: 'Q4', label: 'Q4 (Octubre–Diciembre)' },
      ]}
    />
  );
}

function DateRange({ filters, setFilter }: FiltersInput) {
  return (
    <DateRangeField
      label={FILTER_META.dateRange.label}
      value={{
        from: filters.from ? new Date(filters.from) : undefined,
        to:   filters.to   ? new Date(filters.to)   : undefined,
      }}
      onChange={(v) => {
        setFilter('from', v.from ? v.from.toISOString().slice(0, 10) : '');
        setFilter('to',   v.to   ? v.to.toISOString().slice(0, 10)   : '');
      }}
    />
  );
}

export function buildReportFilters(def: ReportDefinition<any, any>) {
  return (filters: any, setFilter: (k: string, v: any) => void) => (
    <>
      {(def.filters.includes('dateRange') || def.filters.includes('year') || def.filters.includes('quarter')) && (
        <FilterGroup label="Período">
          {def.filters.includes('dateRange') && <DateRange filters={filters} setFilter={setFilter} def={def} />}
          {def.filters.includes('year')      && <YearField filters={filters} setFilter={setFilter} def={def} />}
          {def.filters.includes('quarter')   && <QuarterField filters={filters} setFilter={setFilter} def={def} />}
        </FilterGroup>
      )}
      {(def.filters.includes('project') || def.filters.includes('cftp')) && (
        <FilterGroup label="Contexto">
          {def.filters.includes('project') && <ProjectField filters={filters} setFilter={setFilter} def={def} />}
          {def.filters.includes('cftp')    && <CftpField    filters={filters} setFilter={setFilter} def={def} />}
        </FilterGroup>
      )}
    </>
  );
}
