import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConditionalRedCell } from '../conditional-red-cell';
import { CompoundHeader } from '../compound-header';

describe('<ConditionalRedCell>', () => {
  it('applies red styling when condition true', () => {
    const { container } = render(
      <ConditionalRedCell isRed>{18}</ConditionalRedCell>
    );
    expect(container.firstChild).toHaveClass('bg-destructive/5');
  });

  it('renders plain when false', () => {
    const { container } = render(<ConditionalRedCell isRed={false}>{20}</ConditionalRedCell>);
    expect(container.firstChild).not.toHaveClass('bg-destructive/5');
  });
});

describe('<CompoundHeader>', () => {
  it('renders group row and child row', () => {
    render(
      <table>
        <CompoundHeader
          columns={[
            { key: 'centro', label: 'Centro' },
            {
              group: 'Matriculados',
              children: [
                { key: 'm', label: 'M' },
                { key: 'f', label: 'F' },
              ],
            },
          ]}
        />
      </table>
    );
    expect(screen.getByText('Centro')).toBeInTheDocument();
    expect(screen.getByText('Matriculados')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
  });
});
