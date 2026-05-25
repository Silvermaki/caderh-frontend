'use client';
import type { ReportDefinition } from '@/lib/report/types';
import { FilterGroup } from './filter-group';
import { DateRangeField, MultiSelectField, NumberRangeField, SingleSelectField } from './filter-controls';
import { useFilterCatalog } from '@/hooks/use-filter-catalog';
import { FILTER_META } from '@/lib/report/filter-keys';

interface FiltersInput {
  filters: any;
  setFilter: (k: string, v: any) => void;
  def: ReportDefinition<any, any>;
}

// ─── Contexto ────────────────────────────────────────────────────────────────

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

function CourseField({ filters, setFilter }: FiltersInput) {
  const { options } = useFilterCatalog('course');
  return (
    <MultiSelectField
      label={FILTER_META.course.label}
      value={filters.course ?? []}
      onChange={(v) => setFilter('course', v)}
      options={options}
    />
  );
}

function FinancingSourceField({ filters, setFilter }: FiltersInput) {
  const { options } = useFilterCatalog('financingSource');
  return (
    <MultiSelectField
      label={FILTER_META.financingSource.label}
      value={filters.financingSource ?? []}
      onChange={(v) => setFilter('financingSource', v)}
      options={options}
    />
  );
}

// ─── Período ─────────────────────────────────────────────────────────────────

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

// ─── Demografía ──────────────────────────────────────────────────────────────

function GenderField({ filters, setFilter }: FiltersInput) {
  return (
    <MultiSelectField
      label={FILTER_META.gender.label}
      value={filters.gender ?? []}
      onChange={(v) => setFilter('gender', v)}
      options={[
        { value: 'M', label: 'Hombres' },
        { value: 'F', label: 'Mujeres' },
      ]}
    />
  );
}

function AgeField({ filters, setFilter }: FiltersInput) {
  return (
    <NumberRangeField
      label={FILTER_META.age.label}
      value={{ min: filters.age_min, max: filters.age_max }}
      onChange={(v) => {
        setFilter('age_min', v.min);
        setFilter('age_max', v.max);
      }}
      description="Rango de edad (en años)"
    />
  );
}

// ─── Ubicación ───────────────────────────────────────────────────────────────

function CityField({ filters, setFilter }: FiltersInput) {
  const { options } = useFilterCatalog('municipality');
  return (
    <MultiSelectField
      label={FILTER_META.city.label}
      value={filters.city ?? []}
      onChange={(v) => setFilter('city', v)}
      options={options}
    />
  );
}

function MunicipalityField({ filters, setFilter }: FiltersInput) {
  const { options } = useFilterCatalog('municipality');
  return (
    <MultiSelectField
      label={FILTER_META.municipality.label}
      value={filters.municipality ?? []}
      onChange={(v) => setFilter('municipality', v)}
      options={options}
    />
  );
}

function DepartmentField({ filters, setFilter }: FiltersInput) {
  const { options } = useFilterCatalog('department');
  return (
    <MultiSelectField
      label={FILTER_META.department.label}
      value={filters.department ?? []}
      onChange={(v) => setFilter('department', v)}
      options={options}
    />
  );
}

// ─── Programático ────────────────────────────────────────────────────────────

function TechnicalAreaField({ filters, setFilter }: FiltersInput) {
  const { options } = useFilterCatalog('area');
  return (
    <MultiSelectField
      label={FILTER_META.technicalArea.label}
      value={filters.technicalArea ?? []}
      onChange={(v) => setFilter('technicalArea', v)}
      options={options}
    />
  );
}

// ─── Builder ─────────────────────────────────────────────────────────────────

export function buildReportFilters(def: ReportDefinition<any, any>) {
  return (filters: any, setFilter: (k: string, v: any) => void) => {
    const has = (k: any) => def.filters.includes(k);

    const showPeriodo     = has('dateRange') || has('year') || has('quarter');
    const showContexto    = has('project') || has('cftp') || has('course') || has('financingSource');
    const showDemografia  = has('gender') || has('age') || has('youthStatus');
    const showUbicacion   = has('department') || has('municipality') || has('city');
    const showProgram     = has('technicalArea') || has('trainingType') || has('modality');

    return (
      <>
        {showPeriodo && (
          <FilterGroup label="Período">
            {has('dateRange') && <DateRange     filters={filters} setFilter={setFilter} def={def} />}
            {has('year')      && <YearField     filters={filters} setFilter={setFilter} def={def} />}
            {has('quarter')   && <QuarterField  filters={filters} setFilter={setFilter} def={def} />}
          </FilterGroup>
        )}
        {showContexto && (
          <FilterGroup label="Contexto">
            {has('project')         && <ProjectField         filters={filters} setFilter={setFilter} def={def} />}
            {has('cftp')            && <CftpField            filters={filters} setFilter={setFilter} def={def} />}
            {has('course')          && <CourseField          filters={filters} setFilter={setFilter} def={def} />}
            {has('financingSource') && <FinancingSourceField filters={filters} setFilter={setFilter} def={def} />}
          </FilterGroup>
        )}
        {showDemografia && (
          <FilterGroup label="Demografía">
            {has('gender') && <GenderField filters={filters} setFilter={setFilter} def={def} />}
            {has('age')    && <AgeField    filters={filters} setFilter={setFilter} def={def} />}
          </FilterGroup>
        )}
        {showUbicacion && (
          <FilterGroup label="Ubicación">
            {has('department')   && <DepartmentField   filters={filters} setFilter={setFilter} def={def} />}
            {has('municipality') && <MunicipalityField filters={filters} setFilter={setFilter} def={def} />}
            {has('city')         && <CityField         filters={filters} setFilter={setFilter} def={def} />}
          </FilterGroup>
        )}
        {showProgram && (
          <FilterGroup label="Programático">
            {has('technicalArea') && <TechnicalAreaField filters={filters} setFilter={setFilter} def={def} />}
          </FilterGroup>
        )}
      </>
    );
  };
}
