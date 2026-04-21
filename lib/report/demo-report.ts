import type { ReportDefinition, ColumnDef } from './types';
import { registerReport } from './registry';

type DemoFilters = { from: string; to: string; project: string };
type DemoRow = { centro: string; curso: string; ejecutados: number; programados: number | null };

const columns: ColumnDef<DemoRow>[] = [
  { key: 'centro', label: 'Centro' },
  { key: 'curso',  label: 'Curso' },
  { key: 'ejecutados', label: 'Ejecutados', align: 'right' },
  {
    key: 'programados',
    label: 'Programados',
    align: 'right',
    missingInDb: true,
    missingNote: 'Campo estudiantes_programados pendiente en tabla procesos',
    plannedSource: 'Módulo Cursos / Seguimiento',
  },
];

const MOCK_ROWS: DemoRow[] = [
  { centro: 'CFTP Tegucigalpa',    curso: 'Electricidad', ejecutados: 18, programados: null },
  { centro: 'CFTP San Pedro Sula', curso: 'Enfermería',   ejecutados: 29, programados: null },
  { centro: 'CFTP Choluteca',      curso: 'Cocina',       ejecutados: 15, programados: null },
];

export const demoReport: ReportDefinition<DemoFilters, DemoRow> = {
  id: 'r0-demo',
  code: 'R0',
  category: 'catalogos',
  title: 'Reporte demo',
  subtitle: 'Reporte de validación del shell genérico',
  filters: ['dateRange', 'project'],
  defaultFilters: { from: '', to: '', project: '' },
  columns,
  fetcher: async (filters, _pagination) => {
    await new Promise((r) => setTimeout(r, 300));
    const filtered = filters.project
      ? MOCK_ROWS.filter((r) => r.centro.includes(filters.project))
      : MOCK_ROWS;
    return {
      rows: filtered,
      total: filtered.length,
      totalsRow: {
        centro: 'TOTAL',
        curso: '',
        ejecutados: filtered.reduce((s, r) => s + r.ejecutados, 0),
        programados: null,
      },
    };
  },
  export: { excel: 'client', csv: 'client' },
};

registerReport(demoReport);
