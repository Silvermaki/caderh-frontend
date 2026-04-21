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

export function KpiStrip({ cards, selectedKey, onCardClick }: KpiStripProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
      {cards.map((c) => (
        <KpiCard
          key={c.key}
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
