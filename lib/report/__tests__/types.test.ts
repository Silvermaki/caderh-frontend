import { describe, it, expect } from 'vitest';
import type { ReportDefinition, ColumnDef } from '../types';

describe('ReportDefinition types', () => {
  it('compiles a minimal report definition', () => {
    type Filters = { from: string; to: string };
    type Row = { centro: string; total: number };

    const def: ReportDefinition<Filters, Row> = {
      id: 'r0-demo',
      code: 'R0',
      category: 'catalogos',
      title: 'Demo',
      subtitle: '',
      filters: ['dateRange'],
      columns: [
        { key: 'centro', label: 'Centro' } as ColumnDef<Row>,
        { key: 'total', label: 'Total', align: 'right' } as ColumnDef<Row>,
      ],
      fetcher: async () => ({ rows: [], total: 0 }),
    };

    expect(def.id).toBe('r0-demo');
    expect(def.columns).toHaveLength(2);
  });

  it('supports missingInDb flag on a column', () => {
    type Row = { foo: string };
    const col: ColumnDef<Row> = {
      key: 'foo',
      label: 'Foo',
      missingInDb: true,
      missingNote: 'pending',
      plannedSource: 'módulo X',
    };
    expect(col.missingInDb).toBe(true);
  });
});
