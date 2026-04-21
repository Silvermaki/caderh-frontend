'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReportDefinition, Pagination } from '@/lib/report/types';

export function useReportQuery<TFilters, TRow>(
  def: ReportDefinition<TFilters, TRow>,
  filters: TFilters,
  pagination: Pagination
) {
  return useQuery({
    queryKey: [def.id, filters, pagination],
    queryFn: () => def.fetcher(filters, pagination),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
