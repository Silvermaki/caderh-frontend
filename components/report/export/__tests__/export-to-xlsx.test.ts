import { describe, it, expect, vi, beforeEach } from 'vitest';
import type ExcelJS from 'exceljs';
import { buildWorkbook } from '../export-to-xlsx';
import type { ColumnDef } from '@/lib/report/types';

type Row = { centro: string; total: number; monto?: number; inicio?: string; pct?: number; rowKind?: 'subtotal' };

const cols: ColumnDef<Row>[] = [
  { key: 'centro', label: 'Centro' },
  { key: 'total', label: 'Total', align: 'right', format: 'count' },
  { key: 'monto', label: 'Monto', align: 'right', format: 'money' },
  { key: 'inicio', label: 'Inicio', format: 'date' },
  { key: 'pct', label: '% Mujeres', align: 'right', format: 'percent' },
];

// Encabezado en la fila 5 (filas 1–4: banner); datos desde la 6.
const HEADER = 5;

function columnValues(ws: ExcelJS.Worksheet, col: string): string {
  const out: string[] = [];
  ws.eachRow((row) => out.push(String(row.getCell(col).value ?? '')));
  return out.join(' | ');
}

describe('buildWorkbook', () => {
  beforeEach(() => {
    // Sin logo en pruebas: la descarga del PNG falla y se omite.
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
  });

  it('escribe encabezados, filas con formato, subtotales y la fila de totales', async () => {
    const wb = await buildWorkbook<Row>({
      title: 'R0 demo',
      columns: cols,
      rows: [
        { centro: 'A', total: 10, monto: 1500.5, inicio: '2026-03-01', pct: 50 },
        { centro: 'Subtotal', total: 10, rowKind: 'subtotal' },
      ],
      totalsRow: { total: 10, monto: 1500.5, pct: 50 },
      filtersApplied: { Proyecto: 'Proyecto Alfa' },
    });
    const ws = wb.worksheets[0];

    expect(ws.getRow(HEADER).getCell(1).value).toBe('Centro');
    expect(ws.getRow(HEADER).getCell(2).value).toBe('Total');

    const data = ws.getRow(HEADER + 1);
    expect(data.getCell(1).value).toBe('A');
    expect(data.getCell(2).value).toBe(10);
    expect(data.getCell(2).numFmt).toBe('#,##0');
    expect(data.getCell(3).numFmt).toBe('"L "#,##0.00');
    // La fecha se guarda como fecha real (sin desfase de zona horaria).
    expect(data.getCell(4).value).toEqual(new Date(Date.UTC(2026, 2, 1)));
    expect(data.getCell(4).numFmt).toBe('dd/mm/yyyy');
    expect(data.getCell(5).numFmt).toBe('0.0"%"');

    expect(ws.getRow(HEADER + 2).getCell(1).font?.bold).toBe(true);

    const totals = ws.getRow(HEADER + 3);
    expect(totals.getCell(1).value).toBe('Total');
    expect(totals.getCell(2).value).toBe(10);
    expect(totals.getCell(1).font?.bold).toBe(true);

    expect(columnValues(ws, 'A')).toMatch(/Proyecto/);
    expect(columnValues(ws, 'B')).toMatch(/Proyecto Alfa/);
  });

  it('no agrega notas internas aunque haya columnas sin dato', async () => {
    const wb = await buildWorkbook({
      title: 'T', columns: [{ key: 'a', label: 'A', missingInDb: true }], rows: [{ a: null }], filtersApplied: {},
    });
    expect(columnValues(wb.worksheets[0], 'A')).not.toMatch(/pendiente/i);
  });
});
