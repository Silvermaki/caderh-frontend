import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useReportQuery } from '../use-report-query';
import type { ReportDefinition, Page } from '@/lib/report/types';

type Row = { centro: string; total: number };

const fakeDef: ReportDefinition<{ project: string }, Row> = {
  id: 'test-report',
  code: 'R0',
  category: 'catalogos',
  title: 'Test',
  subtitle: '',
  filters: ['project'],
  columns: [],
  fetcher: vi.fn(async () => ({
    rows: [{ centro: 'A', total: 10 }],
    total: 1,
  } as Page<Row>)),
};

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useReportQuery', () => {
  it('calls fetcher and returns rows', async () => {
    const { result } = renderHook(
      () => useReportQuery(fakeDef, { project: '123' }, { offset: 0, limit: 25 }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.rows).toHaveLength(1);
    expect(fakeDef.fetcher).toHaveBeenCalledWith(
      { project: '123' },
      { offset: 0, limit: 25 }
    );
  });

  it('caches by (id, filters, pagination)', async () => {
    const qc = new QueryClient();
    const w = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(
      ({ f }) => useReportQuery(fakeDef, f, { offset: 0, limit: 25 }),
      { wrapper: w, initialProps: { f: { project: 'A' } } }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const callsA = (fakeDef.fetcher as any).mock.calls.length;

    rerender({ f: { project: 'A' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((fakeDef.fetcher as any).mock.calls.length).toBe(callsA);

    rerender({ f: { project: 'B' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((fakeDef.fetcher as any).mock.calls.length).toBe(callsA + 1);
  });
});
