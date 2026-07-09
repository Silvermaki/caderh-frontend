import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R5Filters { project?: string[]; }
export interface R5Row {}

const missing = {
  missingInDb: true as const,
  missingNote: 'Módulo "kits emprendimiento" no implementado',
};

const columns: ColumnDef<R5Row>[] = [
  { key: 'jovenNombre',       label: 'Joven',              align: 'left',  ...missing, render: () => '—' } as any,
  { key: 'jovenDni',          label: 'DNI',                align: 'left',  ...missing, render: () => '—' } as any,
  { key: 'proyecto',          label: 'Proyecto',           align: 'left',  ...missing, render: () => '—' } as any,
  { key: 'emprendimiento',    label: 'Emprendimiento',     align: 'left',  ...missing, render: () => '—' } as any,
  { key: 'rubro',             label: 'Rubro',              align: 'left',  ...missing, render: () => '—' } as any,
  { key: 'fechaEntrega',      label: 'Fecha de entrega',   align: 'left',  ...missing, render: () => '—' } as any,
  { key: 'montoOtorgado',     label: 'Monto otorgado',     align: 'right', ...missing, render: () => '—' } as any,
  { key: 'estadoSeguimiento', label: 'Estado seguimiento', align: 'left',  ...missing, render: () => '—' } as any,
];

export const r5Definition: ReportDefinition<R5Filters, R5Row> = {
  id: 'r5-kits-emprendimiento',
  code: 'R5',
  category: 'estudiantes',
  title: 'Kits de emprendimiento entregados',
  subtitle: 'Pendiente: módulo de kits en desarrollo',
  pendingModule:
    'Este reporte se alimentará del módulo de kits de emprendimiento, que aún no se ha desarrollado. Cuando el sistema capture las entregas (joven, emprendimiento, rubro, monto y seguimiento), el reporte se llenará automáticamente.',
  filters: ['project'],
  defaultFilters: {},
  columns,
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async () => {
    const res = await apiGet<{ rows: R5Row[]; total: number; meta?: any }>(
      '/reports/r5-kits-emprendimiento',
    );
    return { rows: res.rows, total: res.total, meta: res.meta };
  },
};

registerReport(r5Definition);
