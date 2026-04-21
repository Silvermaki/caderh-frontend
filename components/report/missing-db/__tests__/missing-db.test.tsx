import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MissingDbHeader } from '../missing-db-header';
import { MissingDbBanner } from '../missing-db-banner';

describe('<MissingDbHeader>', () => {
  it('renders label with warning icon', () => {
    render(<MissingDbHeader label="Programados" note="pendiente" source="Cursos" />);
    expect(screen.getByText('Programados')).toBeInTheDocument();
    expect(screen.getByLabelText(/columna pendiente/i)).toBeInTheDocument();
  });
});

describe('<MissingDbBanner>', () => {
  it('shows count and opens popover', async () => {
    render(
      <MissingDbBanner
        missing={[
          { key: 'programados', label: 'Programados', source: 'Cursos', priority: 'high' },
          { key: 'delta', label: 'Δ', source: 'Derivada', priority: 'med' },
        ]}
      />
    );
    expect(screen.getByText(/2 columnas/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /ver cuáles/i }));
    expect(screen.getByText('Δ')).toBeInTheDocument();
  });

  it('renders null when empty', () => {
    const { container } = render(<MissingDbBanner missing={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
