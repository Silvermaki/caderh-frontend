// Formato de celdas compartido por la tabla y las exportaciones (Excel, CSV).
import type { ColumnDef, ColumnFormat } from './types';
import { formatIsoDate } from './filter-keys';

/**
 * Formato efectivo de una columna: el explícito (`format`) o, para las
 * definiciones que aún no lo declaran (R6–R9), el inferido por el nombre de
 * la key como hacían las exportaciones.
 */
export function columnFormat(c: ColumnDef<any>): ColumnFormat | undefined {
  if (c.format) return c.format;
  const k = c.key.toLowerCase();
  if (/(pct|porcent|%)/.test(k)) return 'percent';
  if (
    /(presupuesto|monto|desembols|donac|overhead|saldo|ejecutado|ingreso|gasto|kit|estipendio|total)/.test(k)
    && !/(count|cantidad|hombres|mujeres|formacion)/.test(k)
  ) return 'money';
  return undefined;
}

const nf0 = new Intl.NumberFormat('es-HN', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nfAuto = new Intl.NumberFormat('es-HN', { maximumFractionDigits: 2 });

/** Valor de celda → texto para la tabla. Vacío → '—'. */
export function formatValue(value: unknown, format?: ColumnFormat): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'number' ? value : NaN;
  switch (format) {
    case 'money':
      return Number.isFinite(n) ? `L ${nf2.format(n)}` : String(value);
    case 'percent':
      return Number.isFinite(n) ? `${n.toFixed(1)}%` : String(value);
    case 'count':
      return Number.isFinite(n) ? nf0.format(n) : String(value);
    case 'date':
      return formatIsoDate(String(value));
    case 'year':
    case 'text':
      return String(value);
    default:
      return Number.isFinite(n) ? nfAuto.format(n) : String(value);
  }
}

/** Fecha 'YYYY-MM-DD' → Date UTC (Excel guarda la fecha sin desfase horario). */
export function isoToUtcDate(value: unknown): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

// Texto que Excel interpretaría como fórmula al abrir el CSV ("=…", "@…",
// "+cmd", "-cmd"): se antepone un apóstrofo. Teléfonos como "+504 9999" o
// números negativos no se tocan.
function neutralizeFormula(s: string): string {
  return /^[=@\t\r]/.test(s) || /^[+-][^\d\s]/.test(s) ? `'${s}` : s;
}

function csvCell(value: unknown, format?: ColumnFormat): string {
  if (value === null || value === undefined) return '';
  let s: string;
  if (typeof value === 'number') {
    s = format === 'money' ? value.toFixed(2) : String(value);
  } else {
    s = neutralizeFormula(String(value));
  }
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * CSV real (antes "CSV" bajaba un .xlsx). Separador coma, fin de línea CRLF y
 * BOM UTF-8 para que Excel respete tildes y eñes. Incluye la fila de totales.
 */
export function buildCsv<TRow>(
  columns: ColumnDef<TRow>[],
  rows: TRow[],
  totalsRow?: Record<string, unknown> | null,
): string {
  const lines: string[] = [];
  lines.push(columns.map((c) => csvCell(c.label)).join(','));
  for (const row of rows) {
    lines.push(columns.map((c) => csvCell(c.missingInDb ? null : (row as any)[c.key], columnFormat(c))).join(','));
  }
  if (totalsRow) {
    lines.push(columns.map((c, i) => {
      const v = c.missingInDb ? null : totalsRow[c.key];
      return csvCell(v ?? (i === 0 ? 'Total' : null), columnFormat(c));
    }).join(','));
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}
