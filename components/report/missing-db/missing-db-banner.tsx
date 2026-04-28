'use client';

import { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// The "missing-in-DB" banner is a development aid for the team — it lists
// columns the client still has to wire up. End users in production should
// not see it (the cells already render `—` and the export footer notes them).
function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '[::1]' ||
    host.endsWith('.local')
  );
}

export interface MissingDbItem {
  key: string;
  label: string;
  source: string;
  priority: 'high' | 'med' | 'low';
}

export interface MissingDbBannerProps {
  missing: MissingDbItem[];
}

const prioBg: Record<MissingDbItem['priority'], string> = {
  high: 'bg-destructive/15 text-destructive',
  med:  'bg-warning/15 text-warning',
  low:  'bg-info/15 text-info',
};

export function MissingDbBanner({ missing }: MissingDbBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  // Hydrate to `true` only on localhost (after mount, to keep SSR markup stable).
  const [showOnHost, setShowOnHost] = useState(false);
  useEffect(() => { setShowOnHost(isLocalhost()); }, []);

  if (!showOnHost || missing.length === 0 || dismissed) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-info/40 bg-info/10 px-3 py-2 text-sm text-info-foreground mb-4">
      <Info className="h-4 w-4 text-info shrink-0" />
      <span>
        Este reporte tiene <b>{missing.length} columnas</b> pendientes de captura en el sistema. Se muestran vacías (—) hasta que se defina cómo capturarlas.
      </span>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="ml-auto text-xs underline underline-offset-2">
            Ver cuáles ▾
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[460px] p-0" align="end">
          <div className="px-3 py-2 border-b text-sm font-semibold">
            Columnas sin fuente de datos ({missing.length})
          </div>
          <ul className="divide-y">
            {missing.map((m) => (
              <li key={m.key} className="flex items-start justify-between px-3 py-2 gap-2">
                <div>
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-xs text-muted-foreground">Origen previsto: {m.source}</div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${prioBg[m.priority]}`}>
                  {m.priority === 'high' ? 'Alta' : m.priority === 'med' ? 'Media' : 'Baja'}
                </span>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
      <button
        type="button"
        aria-label="Descartar"
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
