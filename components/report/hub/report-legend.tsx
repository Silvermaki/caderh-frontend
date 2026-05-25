'use client';

import { useState } from 'react';
import {
  Flame, Gauge, Layers, Columns, AlertTriangle, FileText,
  Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LegendItem {
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  label: string;
  description: string;
}

// Keep in sync with the chips emitted by `variantChips()` in `report-row.tsx`.
const LEGEND_ITEMS: LegendItem[] = [
  {
    icon: Flame,
    className: 'text-destructive',
    label: 'Formato rojo condicional',
    description: 'Algunas celdas se pintan en rojo cuando lo ejecutado es menor al presupuesto.',
  },
  {
    icon: Gauge,
    className: 'text-info',
    label: 'Con KPIs',
    description: 'El reporte muestra tarjetas con métricas clave arriba de la tabla.',
  },
  {
    icon: Layers,
    className: 'text-primary',
    label: 'Tabla jerárquica',
    description: 'Las filas se agrupan en niveles (por ejemplo: Ciudad → Centro → Curso).',
  },
  {
    icon: Columns,
    className: 'text-primary',
    label: 'Encabezados compuestos',
    description: 'La tabla usa encabezados de varios niveles con celdas combinadas (M/F/Total).',
  },
  {
    icon: FileText,
    className: 'text-muted-foreground',
    label: 'Plantilla institucional',
    description: 'No es tabla: genera un archivo Excel/PDF a partir de una plantilla oficial.',
  },
  {
    icon: AlertTriangle,
    className: 'text-warning',
    label: 'Columnas pendientes',
    description: 'El reporte tiene columnas que aún no se capturan en el sistema; se muestran vacías (—).',
  },
];

export function ReportLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-card/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground',
          'hover:bg-muted/50 rounded-lg transition-colors'
        )}
      >
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span className="font-medium">Significado de los iconos en los reportes</span>
        {open
          ? <ChevronUp className="h-3.5 w-3.5 ml-auto" />
          : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
      </button>
      {open && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 px-4 pb-3 pt-1 text-xs">
          {LEGEND_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label} className="flex items-start gap-2">
                <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', item.className)} />
                <div className="leading-snug">
                  <div className="font-medium text-foreground">{item.label}</div>
                  <div className="text-muted-foreground">{item.description}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
