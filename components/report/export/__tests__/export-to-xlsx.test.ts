import { describe, it, expect } from 'vitest';
import { buildWorkbook } from '../export-to-xlsx';
import type { ColumnDef } from '@/lib/report/types';

type Row = { centro: string; total: number };

describe('buildWorkbook', () => {
  it('produces a workbook with headers and rows', () => {
    const cols: ColumnDef<Row>[] = [
      { key: 'centro', label: 'Centro' },
      { key: 'total', label: 'Total', align: 'right' },
    ];
    const wb = buildWorkbook({
      title: 'R0 demo',
      columns: cols,
      rows: [{ centro: 'A', total: 10 }],
      filtersApplied: { from: '2026-01-01' },
      missingColumns: [],
    });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet['A1'].v).toBe('Centro');
    expect(sheet['B1'].v).toBe('Total');
    expect(sheet['A2'].v).toBe('A');
    expect(sheet['B2'].v).toBe(10);
  });

  it('appends a note at the bottom when missingColumns non-empty', () => {
    const cols: ColumnDef<any>[] = [{ key: 'a', label: 'A' }];
    const wb = buildWorkbook({
      title: 'T', columns: cols, rows: [], filtersApplied: {}, missingColumns: ['colX'],
    });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const values = Object.keys(sheet).filter((k) => k.startsWith('A')).map((k) => sheet[k].v);
    expect(values.join(' ')).toMatch(/pendientes de captura/i);
  });
});
