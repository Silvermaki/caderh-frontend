import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScopeBar } from '../scope-bar';

describe('<ScopeBar>', () => {
  it('renders pill with count when filters active', () => {
    render(
      <ScopeBar
        activeCount={3}
        chips={[{ key: 'project', label: 'Proyecto X' }]}
        onOpen={() => {}}
        onRemove={() => {}}
        onClearAll={() => {}}
      />
    );
    expect(screen.getByText(/Filtros/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows "Sin filtros" when no active count', () => {
    render(
      <ScopeBar activeCount={0} chips={[]} onOpen={() => {}} onRemove={() => {}} onClearAll={() => {}} />
    );
    expect(screen.getByText(/Sin filtros/i)).toBeInTheDocument();
  });

  it('fires onOpen when pill clicked', async () => {
    const onOpen = vi.fn();
    render(<ScopeBar activeCount={2} chips={[]} onOpen={onOpen} onRemove={() => {}} onClearAll={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /filtros/i }));
    expect(onOpen).toHaveBeenCalled();
  });

  it('removes individual chip', async () => {
    const onRemove = vi.fn();
    render(
      <ScopeBar
        activeCount={1}
        chips={[{ key: 'project', label: 'Proyecto X' }]}
        onOpen={() => {}}
        onRemove={onRemove}
        onClearAll={() => {}}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /remover proyecto x/i }));
    expect(onRemove).toHaveBeenCalledWith('project');
  });
});
