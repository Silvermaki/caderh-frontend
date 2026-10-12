// Utilidades de columnas compartidas por la tabla y las exportaciones.
import type { AnyColumn, ColumnDef, CompoundColumnDef } from './types';

export function flatten<TRow>(cols: AnyColumn<TRow>[]): ColumnDef<TRow>[] {
  return cols.flatMap((c) => ('group' in c ? (c as CompoundColumnDef<TRow>).children : [c as ColumnDef<TRow>]));
}

/** Valor de celda considerado "vacío" para efectos de `hideIfEmpty`. */
function isEmptyCell(v: unknown): boolean {
  return v == null || v === '' || v === '—';
}

/**
 * Filtra columnas marcadas con `hideIfEmpty` cuando TODAS las filas dadas
 * traen valor vacío para su key. Los grupos compuestos filtran sus hijas y
 * desaparecen si quedan sin ninguna.
 */
export function visibleOnly<TRow>(cols: AnyColumn<TRow>[], rows: TRow[]): AnyColumn<TRow>[] {
  const keep = (c: ColumnDef<TRow>) =>
    !c.hideIfEmpty || rows.length === 0 || rows.some((r) => !isEmptyCell((r as any)[c.key]));
  return cols
    .map((c) =>
      'group' in c
        ? ({ ...c, children: (c as CompoundColumnDef<TRow>).children.filter(keep) } as AnyColumn<TRow>)
        : c
    )
    .filter((c) => ('group' in c ? (c as CompoundColumnDef<TRow>).children.length > 0 : keep(c as ColumnDef<TRow>)));
}

/**
 * Como `flatten`, pero las columnas de un grupo llevan el nombre del grupo
 * ("Egresados · Hombres"): en Excel, CSV y PDF no hay encabezado compuesto y
 * "Hombres" saldría repetido sin contexto.
 */
export function flattenForExport<TRow>(cols: AnyColumn<TRow>[]): ColumnDef<TRow>[] {
  return cols.flatMap((c) =>
    'group' in c
      ? (c as CompoundColumnDef<TRow>).children.map((ch) => ({ ...ch, label: `${(c as CompoundColumnDef<TRow>).group} · ${ch.label}` }))
      : [c as ColumnDef<TRow>]
  );
}
