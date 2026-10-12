'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { FilterKey, ReportDefinition } from '@/lib/report/types';
import { FilterGroup } from './filter-group';
import { DateField, DateRangeField, MultiSelectField, NumberRangeField, SingleSelectField } from './filter-controls';
import { catalogOptions, catalogQueryOptions, useFilterCatalog, type CatalogKey } from '@/hooks/use-filter-catalog';
import { apiGet } from '@/lib/api/reports-client';
import { FILTER_GROUPS, FILTER_META, FILTER_PARAMS, filtersByGroup } from '@/lib/report/filter-keys';
import {
  COURSE_RESULT_OPTIONS, GENDER_OPTIONS, QUARTER_OPTIONS, YOUTH_STATUS_OPTIONS, type Option,
} from '@/lib/report/filter-options';

export type SetFilter = (key: string, value: unknown) => void;
/** Cambia varios parámetros en una sola navegación (rango de fechas, edad). */
export type SetFilters = (next: Record<string, unknown>) => void;

interface FieldProps {
  filters: Record<string, any>;
  setFilter: SetFilter;
  setFilters: SetFilters;
  label: string;
  description?: string;
  /** Filtros que declara el reporte. */
  keys: FilterKey[];
}

const hasValue = (v: unknown) =>
  v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);

// ─── Contexto y catálogos ────────────────────────────────────────────────────

function CatalogField({ catalog, param, ...p }: FieldProps & { catalog: CatalogKey; param: string }) {
  const { options } = useFilterCatalog(catalog);
  return (
    <MultiSelectField
      label={p.label}
      description={p.description}
      value={p.filters[param] ?? []}
      onChange={(v) => p.setFilter(param, v)}
      options={options}
    />
  );
}

function StaticField({ options, param, ...p }: FieldProps & { options: Option[]; param: string }) {
  return (
    <MultiSelectField
      label={p.label}
      description={p.description}
      value={p.filters[param] ?? []}
      onChange={(v) => p.setFilter(param, v)}
      options={options}
    />
  );
}

// Al cambiar de centro se descartan los cursos elegidos que ya no pertenecen a
// ninguno de los centros (si no, el reporte quedaría vacío sin razón visible).
function CftpField(p: FieldProps) {
  const { options } = useFilterCatalog('cftp');
  const hasCourse = p.keys.includes('course');
  const courses = useQuery({ ...catalogQueryOptions('course'), enabled: hasCourse });
  return (
    <MultiSelectField
      label={p.label}
      description={p.description}
      value={p.filters.cftp ?? []}
      options={options}
      onChange={(v) => {
        const chosen: string[] = p.filters.course ?? [];
        if (!hasCourse || !v.length || !chosen.length || !courses.data) {
          p.setFilter('cftp', v);
          return;
        }
        const allowed = new Set(
          courses.data.filter((c: any) => v.includes(String(c.centro_id))).map((c: any) => String(c.id))
        );
        p.setFilters({ cftp: v, course: chosen.filter((id) => allowed.has(id)) });
      }}
    />
  );
}

// Con centros elegidos, el curso solo ofrece los de esos centros.
function CourseField(p: FieldProps) {
  const { data } = useQuery(catalogQueryOptions('course'));
  const cftp: string[] = p.filters.cftp ?? [];
  const rows = cftp.length ? (data ?? []).filter((r: any) => cftp.includes(String(r.centro_id))) : data;
  return (
    <MultiSelectField
      label={p.label}
      description={cftp.length ? 'Solo cursos de los centros elegidos' : p.description}
      value={p.filters.course ?? []}
      onChange={(v) => p.setFilter('course', v)}
      options={catalogOptions('course', rows)}
    />
  );
}

// ─── Período ─────────────────────────────────────────────────────────────────

// Fallback histórico: los datos del SGC tienen procesos desde 2019 y con
// solo 5 años hacia atrás quedaban inaccesibles ("los filtros no funcionan
// para ver años anteriores" — observación CADERH).
const FALLBACK_OLDEST_YEAR = 2018;

// Cache a nivel de módulo: el rango de años con datos se consulta al backend
// una sola vez por sesión (todas las instancias de YearField lo comparten).
let yearsRangeCache: { min: number; max: number } | null = null;
let yearsRangePromise: Promise<{ min: number; max: number }> | null = null;

function fetchYearsRange(): Promise<{ min: number; max: number }> {
  if (!yearsRangePromise) {
    yearsRangePromise = apiGet<{ min: number; max: number }>('/reports/meta/years')
      .then((r) => {
        yearsRangeCache = r;
        return r;
      })
      .catch((e) => {
        // Permite reintentar en el próximo mount si la petición falló.
        yearsRangePromise = null;
        throw e;
      });
  }
  return yearsRangePromise;
}

function YearField(p: FieldProps) {
  const current = new Date().getFullYear();
  const [range, setRange] = useState(yearsRangeCache);

  useEffect(() => {
    if (yearsRangeCache) return; // ya resuelto: sin refetch ni parpadeo
    let alive = true;
    fetchYearsRange()
      .then((r) => { if (alive) setRange(r); })
      .catch(() => { /* fallback silencioso al rango 2018..actual */ });
    return () => { alive = false; };
  }, []);

  // Mientras carga (o si falla) se usa el comportamiento previo: 2018..actual.
  const max = range && Number.isFinite(range.max) ? range.max : current;
  const min = range && Number.isFinite(range.min) && range.min <= max
    ? range.min
    : FALLBACK_OLDEST_YEAR;
  const options = Array.from({ length: Math.max(max - min + 1, 1) }).map((_, i) => {
    const y = max - i;
    return { value: String(y), label: String(y) };
  });
  return (
    <SingleSelectField
      label={p.label}
      description={p.description}
      value={p.filters.year ? String(p.filters.year) : ''}
      onChange={(v) => p.setFilter('year', v ? Number(v) : undefined)}
      options={options}
      clearLabel="Todos los años"
    />
  );
}

function QuarterField(p: FieldProps) {
  return (
    <SingleSelectField
      label={p.label}
      description={p.description}
      value={p.filters.quarter ?? ''}
      onChange={(v) => p.setFilter('quarter', v || undefined)}
      options={QUARTER_OPTIONS}
      clearLabel="Todo el año"
    />
  );
}

function DateRange(p: FieldProps) {
  return (
    <DateRangeField
      label={p.label}
      description={p.description}
      value={{ from: p.filters.from, to: p.filters.to }}
      onChange={(v) => p.setFilters({ from: v.from, to: v.to })}
    />
  );
}

function CutoffDate(p: FieldProps) {
  return (
    <DateField
      label={p.label}
      description={p.description}
      value={p.filters.corte}
      onChange={(v) => p.setFilter('corte', v)}
      placeholder="Hoy"
    />
  );
}

// ─── Demografía ──────────────────────────────────────────────────────────────

function AgeField(p: FieldProps) {
  return (
    <NumberRangeField
      label={p.label}
      value={{ min: p.filters.age_min, max: p.filters.age_max }}
      onChange={(v) => p.setFilters({ age_min: v.min, age_max: v.max })}
      description={p.description ?? 'Rango de edad (en años)'}
    />
  );
}

// ─── Registro de campos ──────────────────────────────────────────────────────

const FIELDS: Partial<Record<FilterKey, (p: FieldProps) => JSX.Element>> = {
  dateRange: DateRange,
  year: YearField,
  quarter: QuarterField,
  cutoffDate: CutoffDate,
  project: (p) => <CatalogField {...p} catalog="project" param="project" />,
  cftp: CftpField,
  course: CourseField,
  financingSource: (p) => <CatalogField {...p} catalog="financingSource" param="financingSource" />,
  gender: (p) => <StaticField {...p} options={GENDER_OPTIONS} param="gender" />,
  age: AgeField,
  courseResult: (p) => <StaticField {...p} options={COURSE_RESULT_OPTIONS} param="resultado" />,
  youthStatus: (p) => <StaticField {...p} options={YOUTH_STATUS_OPTIONS} param="estatus" />,
  department: (p) => <CatalogField {...p} catalog="department" param="department" />,
  municipality: (p) => <CatalogField {...p} catalog="municipality" param="municipality" />,
  city: (p) => <CatalogField {...p} catalog="municipality" param="city" />,
  technicalArea: (p) => <CatalogField {...p} catalog="area" param="technicalArea" />,
};

/** Filtros del reporte que tienen control (los demás no se pintan). */
export function renderableFilters(def: ReportDefinition<any, any>): FilterKey[] {
  return def.filters.filter((k) => FIELDS[k]);
}

// ─── Builder ─────────────────────────────────────────────────────────────────

/**
 * Panel de filtros del reporte: SOLO los filtros que declara la definición,
 * agrupados (Período, Contexto, …) y con la etiqueta propia del reporte
 * (`filterLabels`) cuando la tiene.
 */
export function buildReportFilters(def: ReportDefinition<any, any>) {
  return function renderFilters(filters: Record<string, any>, setFilter: SetFilter, setFilters: SetFilters) {
    const grouped = filtersByGroup(renderableFilters(def));
    return (
      <>
        {FILTER_GROUPS.map((g) => {
          const keys = grouped[g.key];
          if (!keys.length) return null;
          const active = keys.filter((k) => FILTER_PARAMS[k].some((p) => hasValue(filters[p.name]))).length;
          return (
            <FilterGroup key={g.key} label={g.label} activeCount={active}>
              {keys.map((k) => {
                const Field = FIELDS[k]!;
                const custom = def.filterLabels?.[k];
                return (
                  <Field
                    key={k}
                    filters={filters}
                    setFilter={setFilter}
                    setFilters={setFilters}
                    label={custom?.label ?? FILTER_META[k].label}
                    description={custom?.description}
                    keys={def.filters}
                  />
                );
              })}
            </FilterGroup>
          );
        })}
      </>
    );
  };
}
