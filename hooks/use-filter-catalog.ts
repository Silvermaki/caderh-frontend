'use client';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api/reports-client';

export type CatalogKey =
  | 'project' | 'cftp' | 'course'
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
    map: (r) => ({ value: String(r.id), label: r.nombre }),
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

export function useFilterCatalog(key: CatalogKey) {
  const cfg = CATALOGS[key];
  const { data, isLoading, isError } = useQuery({
    queryKey: ['filter-catalog', key],
    queryFn: async () => {
      const res = await apiGet<{ data: any[] }>(cfg.path, cfg.params);
      return res.data ?? [];
    },
    staleTime: 5 * 60_000,
  });
  const options = (data ?? []).map(cfg.map);
  return { options, isLoading, isError };
}
