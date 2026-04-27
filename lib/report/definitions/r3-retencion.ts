import type { ReportDefinition, ColumnDef } from '../types';
import { registerReport } from '../registry';
import { apiGet } from '@/lib/api/reports-client';

export interface R3Filters { project?: string[]; }
export interface R3Row {
  proyecto: string;
  centro: string;
  curso: string;
  hombresInicial: number;
  mujeresInicial: number;
  totalInicial: number;
  hombresFinal: number;
  mujeresFinal: number;
  totalFinal: number;
  desercion: number;
  pctRetencion: number;
}

const pct = (n: number) => `${n.toFixed(1)}%`;

const columns: ColumnDef<R3Row>[] = [
  { key: 'proyecto',       label: 'Proyecto',      align: 'left',  render: (r: R3Row) => r.proyecto },
  { key: 'centro',         label: 'Centro',        align: 'left',  render: (r: R3Row) => r.centro },
  { key: 'curso',          label: 'Curso',         align: 'left',  render: (r: R3Row) => r.curso },
  { key: 'hombresInicial', label: 'H inicial',     align: 'right', render: (r: R3Row) => String(r.hombresInicial) },
  { key: 'mujeresInicial', label: 'M inicial',     align: 'right', render: (r: R3Row) => String(r.mujeresInicial) },
  { key: 'totalInicial',   label: 'Total inicial', align: 'right', render: (r: R3Row) => String(r.totalInicial) },
  { key: 'hombresFinal',   label: 'H final',       align: 'right', render: (r: R3Row) => String(r.hombresFinal) },
  { key: 'mujeresFinal',   label: 'M final',       align: 'right', render: (r: R3Row) => String(r.mujeresFinal) },
  { key: 'totalFinal',     label: 'Total final',   align: 'right', render: (r: R3Row) => String(r.totalFinal) },
  { key: 'desercion',      label: 'Deserción',     align: 'right', render: (r: R3Row) => String(r.desercion) },
  { key: 'pctRetencion',   label: '% Retención',   align: 'right', render: (r: R3Row) => pct(r.pctRetencion) },
];

export const r3Definition: ReportDefinition<R3Filters, R3Row> = {
  id: 'r3-retencion',
  code: 'R3',
  category: 'estudiantes',
  title: '% de retención',
  subtitle: 'Matrícula inicial vs egresados por curso',
  filters: ['project'],
  defaultFilters: {},
  columns,
  variants: {
    chart: {
      kind: 'bar',
      title: '% de retención por proyecto',
      subtitle: 'Promedio de retención agregado por proyecto',
      xKey: 'proyecto',
      valueFormat: (v: number) => `${v.toFixed(1)}%`,
      series: [
        { key: 'pctRetencion', label: '% Retención', color: 'success' },
      ],
      data: (rows: R3Row[]) => {
        const byProj = new Map<string, { proyecto: string; total: number; count: number }>();
        for (const r of rows) {
          const key = r.proyecto || '—';
          const acc = byProj.get(key) ?? { proyecto: key, total: 0, count: 0 };
          acc.total += r.pctRetencion ?? 0;
          acc.count += 1;
          byProj.set(key, acc);
        }
        return Array.from(byProj.values()).map((p) => ({
          proyecto: p.proyecto,
          pctRetencion: p.count > 0 ? p.total / p.count : 0,
        })).sort((a, b) => b.pctRetencion - a.pctRetencion).slice(0, 10);
      },
    },
  } as any,
  export: { excel: 'client', pdf: 'server', csv: 'client' },
  fetcher: async (filters) => {
    const res = await apiGet<{ rows: R3Row[]; total: number }>(
      '/reports/r3-retencion',
      { project: filters.project?.join(',') },
    );
    return { rows: res.rows, total: res.total };
  },
};

registerReport(r3Definition);
