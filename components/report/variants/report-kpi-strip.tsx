'use client';

import { KpiStrip } from './kpi-strip';
import type { KpiFormat, KpiStripSpec } from '@/lib/report/types';

// Formatos de negocio para las tarjetas KPI:
// 'money' → L 1,234.56 · 'percent' → 12.3% · default → 1,234 (separador de miles).
function formatKpi(value: number, format?: KpiFormat): string {
  switch (format) {
    case 'money':
      return `L ${value.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'percent':
      return `${value.toFixed(1)}%`;
    default:
      return value.toLocaleString('es-HN', { maximumFractionDigits: 0 });
  }
}

export interface ReportKpiStripProps {
  /** Tarjetas declaradas en `definition.variants.kpiStrip.cards`. */
  cards: KpiStripSpec['cards'];
  /** KPIs agregados que devolvió el backend del reporte. */
  kpis: Record<string, number | null | undefined>;
}

/**
 * Tira de KPIs del reporte: cruza las tarjetas de la definición con los
 * valores `kpis` del backend. Si el backend no devuelve la clave de una
 * tarjeta (o no es numérica), esa tarjeta no se pinta.
 */
export function ReportKpiStrip({ cards, kpis }: ReportKpiStripProps) {
  const visible = cards
    .filter((c) => kpis[c.key] != null && Number.isFinite(Number(kpis[c.key])))
    .map((c) => ({
      key: c.key,
      label: c.label,
      color: c.color,
      value: formatKpi(Number(kpis[c.key]), c.format),
    }));

  if (visible.length === 0) return null;
  return <KpiStrip cards={visible} />;
}
