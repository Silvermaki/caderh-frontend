import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportHub } from '../report-hub';
import { registerReport } from '@/lib/report/registry';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/reportes',
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe('ReportHub', () => {
  beforeEach(() => {
    registerReport({
      id: 'test-r1',
      code: 'R1',
      category: 'estudiantes',
      title: 'Test R1',
      subtitle: 'demo',
      filters: [],
      columns: [],
      fetcher: async () => ({ rows: [], total: 0 }),
    } as any);
  });

  it('shows total report count', () => {
    render(<ReportHub />);
    expect(screen.getByText(/reporte disponible/i)).toBeInTheDocument();
  });

  it('hides empty categories', () => {
    render(<ReportHub />);
    expect(screen.queryByText(/aún no hay reportes/i)).not.toBeInTheDocument();
  });

  it('renders registered report inside its category card', () => {
    render(<ReportHub />);
    expect(screen.getByText('Test R1')).toBeInTheDocument();
  });
});
