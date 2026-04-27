import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFilterCatalog } from '../use-filter-catalog';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useFilterCatalog', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => '',
        json: async () => ({ data: [{ id: 'p1', name: 'Proyecto Alpha' }] }),
      })),
    );
  });

  it('loads project options from backend', async () => {
    const { result } = renderHook(() => useFilterCatalog('project'), { wrapper });
    await waitFor(() => expect(result.current.options.length).toBeGreaterThan(0));
    expect(result.current.options[0]).toEqual({ value: 'p1', label: 'Proyecto Alpha' });
  });
});
