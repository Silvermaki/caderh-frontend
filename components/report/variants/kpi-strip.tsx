'use client';

import { KpiCard, type KpiColor } from './kpi-card';

export interface KpiStripCard {
  key: string;
  label: string;
  value: number | string;
  sub?: string;
  color: KpiColor;
}

export interface KpiStripProps {
  cards: KpiStripCard[];
  selectedKey?: string;
  onCardClick?: (key: string) => void;
}

// Columnas según cuántas tarjetas hay (clases completas para que Tailwind
// las genere): 5 o 6 KPIs caben en una fila en pantallas grandes.
const GRID_BY_COUNT: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
  5: 'md:grid-cols-3 lg:grid-cols-5',
  6: 'md:grid-cols-3 lg:grid-cols-6',
};

export function KpiStrip({ cards, selectedKey, onCardClick }: KpiStripProps) {
  return (
    <div className={`grid grid-cols-1 ${GRID_BY_COUNT[cards.length] ?? 'md:grid-cols-2 lg:grid-cols-4'} gap-3 mb-6`}>
      {cards.map((c, i) => (
        <KpiCard
          key={c.key}
          index={i}
          label={c.label}
          value={c.value}
          sub={c.sub}
          color={c.color}
          selected={selectedKey === c.key}
          onClick={onCardClick ? () => onCardClick(c.key) : undefined}
        />
      ))}
    </div>
  );
}
