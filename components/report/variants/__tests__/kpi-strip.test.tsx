import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KpiStrip } from '../kpi-strip';

describe('<KpiStrip>', () => {
  it('renders 4 cards with values', () => {
    render(
      <KpiStrip
        cards={[
          { key: 'new', label: 'Nuevos', color: 'info', value: 10 },
          { key: 'active', label: 'Activos', color: 'success', value: 50 },
          { key: 'done', label: 'Culminados', color: 'accent', value: 30 },
          { key: 'dropped', label: 'Desertados', color: 'destructive', value: 5 },
        ]}
      />
    );
    expect(screen.getByText('Nuevos')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('fires onCardClick with key', async () => {
    const onClick = vi.fn();
    render(
      <KpiStrip
        cards={[{ key: 'new', label: 'Nuevos', color: 'info', value: 10 }]}
        onCardClick={onClick}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /nuevos/i }));
    expect(onClick).toHaveBeenCalledWith('new');
  });
});
