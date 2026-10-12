'use client';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api/reports-client';

export type CatalogKey =
  | 'project' | 'cftp' | 'course' | 'financingSource'
  | 'area' | 'department' | 'municipality'
  | 'instructor';

interface CatalogEndpoint {
  path: string;
  params?: Record<string, string>;
  map: (row: any) => { value: string; label: string };
}

const CATALOGS: Record<CatalogKey, CatalogEndpoint> = {
  project: {
    path: '/supervisor/projects',
    params: { all: 'true' },
    map: (r) => ({ value: String(r.id), label: r.name }),
  },
  cftp: {
    path: '/centros/centros',
    params: { all: 'true' },
    map: (r) => ({ value: String(r.id), label: r.siglas ? `${r.siglas} — ${r.nombre}` : r.nombre }),
  },
  course: {
    path: '/centros/courses',
    params: { all: 'true' },
    // Hay cursos homónimos en varios centros: la etiqueta lleva el centro.
    map: (r) => ({ value: String(r.id), label: r.centro_siglas ? `${r.nombre} · ${r.centro_siglas}` : r.nombre }),
  },
  financingSource: {
    path: '/supervisor/financing-sources',
    params: { all: 'true' },
    map: (r) => ({ value: String(r.id), label: r.name }),
  },
  area: {
    path: '/centros/areas',
    params: { all: 'true' },
    map: (r) => ({ value: String(r.id), label: r.nombre }),
  },
  department: {
    path: '/centros/departamentos',
    params: { all: 'true' },
    map: (r) => ({ value: String(r.id), label: r.nombre }),
  },
  municipality: {
    path: '/centros/municipios',
    params: { all: 'true' },
    map: (r) => ({ value: String(r.id), label: r.nombre }),
  },
  instructor: {
    path: '/centros/instructors',
    params: { all: 'true' },
    map: (r) => ({ value: String(r.id), label: `${r.nombres} ${r.apellidos}` }),
  },
};

/** Opciones de consulta de un catálogo (compartidas con useQueries). */
export function catalogQueryOptions(key: CatalogKey) {
  const cfg = CATALOGS[key];
  return {
    queryKey: ['filter-catalog', key],
    queryFn: async () => {
      const res = await apiGet<{ data: any[] }>(cfg.path, cfg.params);
      return res.data ?? [];
    },
    staleTime: 5 * 60_000,
  };
}

/** Filas crudas de un catálogo → opciones { value, label }. */
export function catalogOptions(key: CatalogKey, rows: any[] | undefined) {
  return (rows ?? []).map(CATALOGS[key].map);
}

export function useFilterCatalog(key: CatalogKey) {
  const { data, isLoading, isError } = useQuery(catalogQueryOptions(key));
  const options = catalogOptions(key, data);
  return { options, isLoading, isError };
}
