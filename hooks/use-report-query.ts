'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReportDefinition, Pagination } from '@/lib/report/types';

/**
 * Paginación "todas las filas": la usan los reportes que paginan en el cliente
 * y las exportaciones (page_size=all en el backend). Es una constante para que
 * la tabla y la exportación compartan la misma entrada de caché.
 */
export const ALL_ROWS: Pagination = { offset: 0, limit: 100000, all: true };

export function useReportQuery<TFilters, TRow>(
  def: ReportDefinition<TFilters, TRow>,
  filters: TFilters,
  pagination: Pagination
) {
  const q = useQuery({
    queryKey: [def.id, filters, pagination],
    queryFn: () => def.fetcher(filters, pagination),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return {
    data: q.data,
    error: q.error,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    isError: q.isError,
    isSuccess: q.isSuccess,
    refetch: q.refetch,
  };
}
