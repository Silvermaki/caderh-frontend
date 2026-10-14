import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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
    expect(screen.getByText(/\d+ reportes? agrupados por categoría/i)).toBeInTheDocument();
  });

  it('hides empty categories', () => {
    render(<ReportHub />);
    expect(screen.queryByText(/aún no hay reportes/i)).not.toBeInTheDocument();
  });

  it('renders registered report inside its category card', () => {
    render(<ReportHub />);
    expect(screen.getByText('Test R1')).toBeInTheDocument();
  });

  it('marca como Próximamente los reportes que aún no tienen datos', () => {
    registerReport({
      id: 'test-r10',
      code: 'R10',
      category: 'directorios',
      title: 'Test R10',
      subtitle: 'demo',
      comingSoon: 'Aquí se listarán los registros.',
      filters: [],
      columns: [],
      fetcher: async () => ({ rows: [], total: 0 }),
    } as any);
    render(<ReportHub />);
    expect(within(screen.getByText('Test R10').closest('a')!).getByText('Próximamente')).toBeInTheDocument();
    expect(within(screen.getByText('Test R1').closest('a')!).queryByText('Próximamente')).not.toBeInTheDocument();
  });
});
