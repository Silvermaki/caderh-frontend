'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { FilterKey } from '@/lib/report/types';
import { paramsFor, parseParamValue, serializeParamValue } from '@/lib/report/filter-keys';

/**
 * Filtros de un reporte guardados en la URL.
 *
 * Lee TODOS los parámetros de los filtros que declara el reporte (`keys`), con
 * su tipo (listas, números, textos). Antes solo leía las claves presentes en
 * `defaults` (en la práctica, el año) y el resto de filtros se quedaba en la
 * URL sin llegar nunca al backend.
 *
 * Un parámetro presente pero vacío ("?from=") significa "sin filtro" aunque
 * haya un valor por defecto: así se puede quitar el rango del año en curso.
 */
export function useUrlFilters<T extends Record<string, any>>(defaults: T, keys: FilterKey[] = []) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // Dependencia por contenido: `keys` suele llegar como arreglo nuevo en cada render.
  const keysId = keys.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const params = useMemo(() => paramsFor(keys), [keysId]);

  const filters = useMemo(() => {
    const out = { ...defaults } as T;
    for (const [name, def] of params) {
      const raw = searchParams.get(name);
      if (raw === null) continue;
      const value = parseParamValue(raw, def.kind);
      if (value === undefined) delete (out as any)[name];
      else (out as any)[name] = value;
    }
    // Claves por defecto que no son filtros declarados (compatibilidad).
    for (const key of Object.keys(defaults)) {
      if (params.has(key)) continue;
      const raw = searchParams.get(key);
      if (raw !== null) (out as any)[key] = raw;
    }
    return out;
  }, [searchParams, defaults, params]);

  const buildUrl = useCallback(
    (next: Partial<T>) => {
      const qs = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(next)) {
        const text = serializeParamValue(v);
        if (text !== null) qs.set(k, text);
        // Vaciar un filtro con valor por defecto deja el parámetro vacío
        // ("sin filtro"); sin default basta con quitarlo.
        else if (k in defaults) qs.set(k, '');
        else qs.delete(k);
      }
      const s = qs.toString();
      return s ? `${pathname}?${s}` : pathname;
    },
    [pathname, searchParams, defaults]
  );

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      router.replace(buildUrl({ [key]: value } as unknown as Partial<T>), { scroll: false });
    },
    [router, buildUrl]
  );

  const setFilters = useCallback(
    (next: Partial<T>) => {
      router.replace(buildUrl(next), { scroll: false });
    },
    [router, buildUrl]
  );

  const clearAll = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return { filters, setFilter, setFilters, clearAll };
}
