import * as XLSX from 'xlsx';
import type { ColumnDef } from '@/lib/report/types';

export interface BuildWorkbookArgs<TRow> {
  title: string;
  columns: ColumnDef<TRow>[];
  rows: TRow[];
  filtersApplied: Record<string, any>;
  missingColumns: string[];
}

export function buildWorkbook<TRow>({
  title, columns, rows, filtersApplied, missingColumns,
}: BuildWorkbookArgs<TRow>): XLSX.WorkBook {
  const aoa: any[][] = [];

  aoa.push(columns.map((c) => c.label));

  for (const row of rows) {
    aoa.push(columns.map((c) => {
      if (c.missingInDb) return '';
      return (row as any)[c.key] ?? '';
    }));
  }

  if (Object.keys(filtersApplied).length > 0) {
    aoa.push([]);
    aoa.push(['Filtros aplicados:']);
    for (const [k, v] of Object.entries(filtersApplied)) {
      aoa.push([k, String(v)]);
    }
  }

  if (missingColumns.length > 0) {
    aoa.push([]);
    aoa.push([`Nota: ${missingColumns.length} columnas pendientes de captura en el sistema:`]);
    for (const k of missingColumns) aoa.push([k]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
  return wb;
}

export function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}
