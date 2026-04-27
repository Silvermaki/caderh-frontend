'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import type { ChartSpec, ChartSeries } from '@/lib/report/types';

const COLOR_BY_TOKEN: Record<NonNullable<ChartSeries['color']>, string> = {
  primary:     'hsl(var(--primary))',
  success:     'hsl(var(--success))',
  info:        'hsl(var(--info))',
  warning:     'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
};

const DONUT_PALETTE = [
  'hsl(var(--primary))',
  'hsl(var(--info))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--accent))',
];

function colorFor(s: ChartSeries, fallbackIdx = 0): string {
  if (s.color) return COLOR_BY_TOKEN[s.color];
  return DONUT_PALETTE[fallbackIdx % DONUT_PALETTE.length];
}

function CustomTooltip({ active, payload, label, valueFormat }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card p-3 shadow-md">
      {label !== undefined && (
        <div className="text-xs font-semibold text-foreground mb-1">{label}</div>
      )}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.payload?.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground tabular-nums">
            {valueFormat ? valueFormat(p.value) : p.value?.toLocaleString('es-HN')}
          </span>
        </div>
      ))}
    </div>
  );
}

export interface ReportChartProps<TRow> {
  spec: ChartSpec<TRow>;
  rows: TRow[];
  /** Used by Onda 3 export to capture the chart as PNG. */
  captureId?: string;
}

export function ReportChart<TRow>({ spec, rows, captureId }: ReportChartProps<TRow>) {
  const data = useMemo(() => spec.data(rows), [spec, rows]);
  const height = spec.height ?? 280;

  if (!data || data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mb-4"
    >
      <Card className="p-6">
        <CardContent className="p-0">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">{spec.title}</h3>
            {spec.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{spec.subtitle}</p>
            )}
          </div>
          <div id={captureId} style={{ height }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(spec, data)}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function renderChart<TRow>(spec: ChartSpec<TRow>, data: Array<Record<string, any>>): React.ReactElement {
  const { kind, xKey, series, valueFormat } = spec;

  const formatValueAxis = (v: number) =>
    valueFormat ? valueFormat(v) : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v);

  if (kind === 'donut') {
    const valueKey = series[0]?.key ?? 'value';
    return (
      <PieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={xKey}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          stroke="none"
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={DONUT_PALETTE[idx % DONUT_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip valueFormat={valueFormat} />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: string) => (
            <span className="text-xs text-muted-foreground">{value}</span>
          )}
        />
      </PieChart>
    );
  }

  if (kind === 'line') {
    return (
      <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatValueAxis} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip valueFormat={valueFormat} />} />
        <Legend verticalAlign="top" height={32} formatter={(v: string) => <span className="text-xs text-muted-foreground">{v}</span>} />
        {series.map((s, i) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={colorFor(s, i)} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    );
  }

  // bar | groupedBar | stackedBar
  const stackId = kind === 'stackedBar' ? 'stack' : undefined;
  return (
    <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
      <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={0} angle={data.length > 6 ? -20 : 0} textAnchor={data.length > 6 ? 'end' : 'middle'} height={data.length > 6 ? 60 : 30} />
      <YAxis tickFormatter={formatValueAxis} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
      <Tooltip content={<CustomTooltip valueFormat={valueFormat} />} cursor={{ fill: 'hsl(var(--primary) / 0.08)' }} />
      <Legend verticalAlign="top" height={32} formatter={(v: string) => <span className="text-xs text-muted-foreground">{v}</span>} />
      {series.map((s, i) => (
        <Bar key={s.key} dataKey={s.key} name={s.label} fill={colorFor(s, i)} stackId={stackId} radius={kind === 'stackedBar' ? 0 : [4, 4, 0, 0]} maxBarSize={48} />
      ))}
    </BarChart>
  );
}
