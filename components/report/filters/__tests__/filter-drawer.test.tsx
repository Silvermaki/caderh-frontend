import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterDrawer } from '../filter-drawer';

describe('<FilterDrawer>', () => {
  it('renders children when open', () => {
    render(
      <FilterDrawer open onOpenChange={() => {}} onApply={() => {}} onClearAll={() => {}} activeCount={2}>
        <div>contenido</div>
      </FilterDrawer>
    );
    expect(screen.getByText('contenido')).toBeInTheDocument();
    expect(screen.getByText(/Filtros/i)).toBeInTheDocument();
  });

  it('fires onApply when Aplicar clicked', async () => {
    const onApply = vi.fn();
    render(
      <FilterDrawer open onOpenChange={() => {}} onApply={onApply} onClearAll={() => {}} activeCount={1}>
        <div />
      </FilterDrawer>
    );
    await userEvent.click(screen.getByRole('button', { name: /aplicar/i }));
    expect(onApply).toHaveBeenCalled();
  });

  it('shows activeCount in header', () => {
    render(
      <FilterDrawer open onOpenChange={() => {}} onApply={() => {}} onClearAll={() => {}} activeCount={3}>
        <div />
      </FilterDrawer>
    );
    expect(screen.getByText(/3 activos/i)).toBeInTheDocument();
  });
});
