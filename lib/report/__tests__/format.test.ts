import { describe, it, expect } from 'vitest';
import { buildCsv, columnFormat, formatValue } from '../format';
import type { ColumnDef } from '../types';

describe('formatValue', () => {
  it('formats by explicit column format', () => {
    expect(formatValue(1234.5, 'money')).toBe('L 1,234.50');
    expect(formatValue(12.345, 'percent')).toBe('12.3%');
    expect(formatValue(2026, 'year')).toBe('2026');
    expect(formatValue('2026-03-09', 'date')).toBe('09/03/2026');
    expect(formatValue(null, 'count')).toBe('—');
  });

  it('infers legacy formats by key only when none is declared', () => {
    expect(columnFormat({ key: 'presupuestoAnual', label: '' })).toBe('money');
    expect(columnFormat({ key: 'pctEjecucion', label: '' })).toBe('percent');
    // Un "total" declarado como conteo no se trata como moneda.
    expect(columnFormat({ key: 'total', label: '', format: 'count' })).toBe('count');
  });
});

describe('buildCsv', () => {
  const cols: ColumnDef<any>[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'monto', label: 'Monto', format: 'money' },
  ];

  it('writes BOM, header, quoted cells and the totals row', () => {
    const csv = buildCsv(cols, [{ nombre: 'Pérez, Ana', monto: 10 }], { monto: 10 });
    expect(csv.startsWith('\uFEFF')).toBe(true);
    const lines = csv.slice(1).trimEnd().split('\r\n');
    expect(lines).toEqual(['Nombre,Monto', '"Pérez, Ana",10.00', 'Total,10.00']);
  });

  it('neutralizes text that a spreadsheet would run as a formula', () => {
    const csv = buildCsv(cols, [{ nombre: '=HYPERLINK("x")', monto: -5 }]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain('-5.00');
  });
});
