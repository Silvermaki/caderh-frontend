import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R13Filters { tipo?: string; }
export interface R13Row {}

const missing = {
  missingInDb: true as const,
  missingNote: 'Módulo Empresas/Donantes pendiente',
};

const columns: ColumnDef<R13Row>[] = [
  { key: 'nombre',             label: 'Nombre entidad',     align: 'left',  ...missing, render: () => '—' } as any,
  { key: 'tipo',               label: 'Tipo',               align: 'left',  ...missing, render: () => '—' } as any,
  { key: 'rubro',              label: 'Rubro/sector',       align: 'left',  ...missing, render: () => '—' } as any,
  { key: 'ubicacion',          label: 'Ubicación',          align: 'left',  ...missing, render: () => '—' } as any,
  { key: 'contactoNombre',     label: 'Contacto',           align: 'left',  ...missing, render: () => '—' } as any,
  { key: 'contactoTelefono',   label: 'Teléfono',           align: 'left',  ...missing, render: () => '—' } as any,
  { key: 'contactoCorreo',     label: 'Correo',             align: 'left',  ...missing, render: () => '—' } as any,
  { key: 'jovenesColocados',   label: 'Jóvenes colocados',  align: 'right', ...missing, render: () => '—' } as any,
  { key: 'donacionesRecibidas', label: 'Donaciones',        align: 'right', ...missing, render: () => '—' } as any,
  { key: 'proyectosParticipa', label: 'Proyectos',          align: 'left',  ...missing, render: () => '—' } as any,
];

export const r13Definition: ReportDefinition<R13Filters, R13Row> = {
  id: 'r13-empresas-donantes',
  code: 'R13',
  category: 'directorios',
  title: 'Empresas, organizaciones y donantes',
  subtitle: 'Pendiente: módulo Empresas/Donantes no implementado',
  filters: [],
  defaultFilters: {},
  columns,
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async () => {
    const res = await apiGet<{ rows: R13Row[]; total: number; meta?: any }>(
      '/reports/r13-empresas-donantes',
    );
    return { rows: res.rows, total: res.total, meta: res.meta };
  },
};

registerReport(r13Definition);
