import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SingleSelectField, MultiSelectField } from '../filter-controls';

describe('SingleSelectField', () => {
  it('calls onChange with single string when option picked', async () => {
    const onChange = vi.fn();
    render(
      <SingleSelectField
        label="Proyecto"
        value=""
        onChange={onChange}
        options={[
          { value: 'p1', label: 'Proyecto 1' },
          { value: 'p2', label: 'Proyecto 2' },
        ]}
      />
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('Proyecto 1'));
    expect(onChange).toHaveBeenCalledWith('p1');
  });
});

describe('MultiSelectField', () => {
  it('renders with array value type', () => {
    const onChange = vi.fn();
    render(
      <MultiSelectField
        label="Proyectos"
        value={[]}
        onChange={onChange}
        options={[
          { value: 'p1', label: 'Proyecto 1' },
          { value: 'p2', label: 'Proyecto 2' },
        ]}
      />
    );
    expect(screen.getByText('Proyectos')).toBeInTheDocument();
  });
});
