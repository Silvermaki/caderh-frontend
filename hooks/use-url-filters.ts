'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function useUrlFilters<T extends Record<string, any>>(defaults: T) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const filters = useMemo(() => {
    const out = { ...defaults } as T;
    for (const key of Object.keys(defaults) as Array<keyof T>) {
      const raw = searchParams.get(key as string);
      if (raw !== null) {
        (out as any)[key] = raw;
      }
    }
    return out;
  }, [searchParams, defaults]);

  const buildUrl = useCallback(
    (next: Partial<T>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === undefined || v === null || v === '') {
          params.delete(k);
        } else {
          params.set(k, String(v));
        }
      }
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, searchParams]
  );

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      router.replace(buildUrl({ [key]: value } as Partial<T>), { scroll: false });
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
