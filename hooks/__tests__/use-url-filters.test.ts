import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUrlFilters } from '../use-url-filters';

let mockParams = new URLSearchParams();
let mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockParams,
  useRouter: () => ({ replace: mockPush, push: mockPush }),
  usePathname: () => '/dashboard/reportes/r0-demo',
}));

describe('useUrlFilters', () => {
  beforeEach(() => {
    mockParams = new URLSearchParams();
    mockPush = vi.fn();
  });

  it('returns defaults when URL is empty', () => {
    const { result } = renderHook(() =>
      useUrlFilters<{ from: string; to: string }>({ from: '', to: '' })
    );
    expect(result.current.filters).toEqual({ from: '', to: '' });
  });

  it('parses URL params into filters', () => {
    mockParams = new URLSearchParams('from=2026-01-01&to=2026-04-30');
    const { result } = renderHook(() =>
      useUrlFilters<{ from: string; to: string }>({ from: '', to: '' })
    );
    expect(result.current.filters.from).toBe('2026-01-01');
    expect(result.current.filters.to).toBe('2026-04-30');
  });

  it('setFilter updates URL via router.replace', () => {
    const { result } = renderHook(() =>
      useUrlFilters<{ project: string }>({ project: '' })
    );
    act(() => {
      result.current.setFilter('project', '123');
    });
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('project=123'),
      { scroll: false }
    );
  });

  it('clearAll resets to defaults and updates URL', () => {
    mockParams = new URLSearchParams('project=123');
    const { result } = renderHook(() =>
      useUrlFilters<{ project: string }>({ project: '' })
    );
    act(() => {
      result.current.clearAll();
    });
    expect(mockPush).toHaveBeenCalled();
  });
});
