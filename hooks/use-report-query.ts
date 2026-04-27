'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReportDefinition, Pagination } from '@/lib/report/types';

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
